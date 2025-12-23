import { WorkflowNodeType, SimulationLog, WorkflowNode, WorkflowEdge } from '../../../types';

export const runSimulationLogic = async (
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    customInput?: string
): Promise<{
    logs: SimulationLog[];
    executionStatus: Record<string, 'success' | 'failed' | 'running' | 'idle'>;
    nodeOutputs: Record<string, any>;
}> => {
    const logs: SimulationLog[] = [];
    const executionStatus: Record<string, 'success' | 'failed' | 'running' | 'idle'> = {};
    const nodeOutputs: Record<string, any> = {};

    const startNode = nodes.find(n => n.type === WorkflowNodeType.START);
    if (!startNode) {
        return { logs, executionStatus, nodeOutputs };
    }

    // Helper to retrieve variable value from object path "a.b.c"
    const getVariableValue = (obj: any, path: string) => {
        if (!path || typeof path !== 'string') return undefined;
        
        // Remove {{ }} wrapper if present
        const cleanPath = path.replace(/\{\{(.*?)\}\}/g, '$1').trim();
        
        // Handle 'payload' special case
        if (cleanPath === 'payload') return obj.payload;

        const parts = cleanPath.split('.');
        let current = obj;
        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }
        return current;
    };

    // Helper function to replace variables in strings
    const replaceVariables = (str: string, variables: any) => {
        if (typeof str !== 'string') return str;
        return str.replace(/\{\{(.*?)\}\}/g, (match, variableName) => {
            const trimmedName = variableName.trim();
            // Check if variable exists in payload
            if (variables.payload && trimmedName in variables.payload) {
                return variables.payload[trimmedName];
            }
            // Check if variable exists in steps output
            if (variables.steps && trimmedName in variables.steps) {
                return variables.steps[trimmedName];
            }
            // Check if variable exists in nodes output
            if (variables.nodes && trimmedName in variables.nodes) {
                return variables.nodes[trimmedName];
            }
            // Check if variable is "payload"
            if (trimmedName === 'payload') {
                return variables.payload;
            }
            // Use getVariableValue for deep paths
            const deepValue = getVariableValue(variables, trimmedName);
            if (deepValue !== undefined) return String(deepValue);

            // Return original match if variable not found
            return match;
        });
    };

    // Helper for SQL Processing (Variables + IF logic)
    const processSQLTemplate = (sql: string, context: any) => {
        if (typeof sql !== 'string') return sql;
        
        // 1. Handle IF logic: {% if condition %} ... {% else %} ... {% endif %}
        let processed = sql;
        const ifRegex = /\{%\s*if\s+(.+?)\s*%\}([\s\S]*?)(?:\{%\s*else\s*%\}([\s\S]*?))?\{%\s*endif\s*%\}/g;
        
        processed = processed.replace(ifRegex, (match, condition, truePart, falsePart) => {
            try {
                const cleanCondition = condition.replace(/\{\{(.*?)\}\}/g, '$1');
                const evalContext = {
                    ...context.payload,
                    ...context.steps,
                    ...context.nodes,
                    payload: context.payload,
                    nodes: context.nodes || {},
                    steps: context.steps || {}
                };
                const contextKeys = Object.keys(evalContext);
                const contextValues = Object.values(evalContext);
                const conditionFunc = new Function(...contextKeys, `return ${cleanCondition}`);
                const result = conditionFunc(...contextValues);
                return result ? truePart : (falsePart || '');
            } catch (e) {
                return match; // On error, keep original template
            }
        });

        // 2. Handle simple variables: {{variable}}
        return replaceVariables(processed, context);
    };

    // Helper to evaluate conditions
    const evaluateConditions = (conditionGroups: any[], expression: string | undefined, context: any) => {
        let finalExpression = expression || 'true';
        
        if (conditionGroups && conditionGroups.length > 0) {
            const groupExpressions = conditionGroups.map((group: any) => {
                const conditions = (group.conditions || []).map((cond: any) => {
                    let { variable, operator, value } = cond;
                    if (!variable) return 'true';
                    
                    const cleanVariable = variable.replace(/\{\{(.*?)\}\}/g, '$1');
                    
                    let val = value;
                    if (typeof value === 'string') {
                        if (value.startsWith('{{')) {
                            val = value.replace(/\{\{(.*?)\}\}/g, '$1');
                        } else if (!isNaN(Number(value)) && value.trim() !== '') {
                            val = Number(value);
                        } else {
                            val = `'${value}'`;
                        }
                    }
                    
                    const safeVariable = cleanVariable.split('.').reduce((acc, part, index) => {
                        if (index === 0) return part;
                        return `${acc}?.['${part}']`;
                    }, '');
                    
                    switch (operator) {
                        case '==': return `${safeVariable} == ${val}`;
                        case '!=': return `${safeVariable} != ${val}`;
                        case '>': return `${safeVariable} > ${val}`;
                        case '<': return `${safeVariable} < ${val}`;
                        case '>=': return `${safeVariable} >= ${val}`;
                        case '<=': return `${safeVariable} <= ${val}`;
                        case 'contains': return `String(${safeVariable}).includes(String(${val}))`;
                        case 'not_contains': return `!String(${safeVariable}).includes(String(${val}))`;
                        case 'empty': return `!${safeVariable} || (typeof ${safeVariable} === 'string' && ${safeVariable}.length === 0)`;
                        case 'not_empty': return `${safeVariable} && (typeof ${safeVariable} === 'string' ? ${safeVariable}.length > 0 : true)`;
                        default: return 'true';
                    }
                });
                return `(${conditions.join(` ${group.logicalOperator || 'AND'} `)})`;
            });
            finalExpression = groupExpressions.join(' OR ');
        }

        const cleanExpression = finalExpression.replace(/\{\{(.*?)\}\}/g, '$1');

        try {
            const evalContext = {
                ...context.payload,
                ...context.steps,
                ...context.nodes,
                payload: context.payload,
                nodes: context.nodes || {},
                steps: context.steps || {},
                loop: context.loop || {}
            };

            const contextKeys = Object.keys(evalContext);
            const contextValues = Object.values(evalContext);
            
            const funcBody = `
                try {
                    return ${cleanExpression};
                } catch (e) {
                    return false;
                }
            `;
            const conditionFunc = new Function(...contextKeys, funcBody);
            return !!conditionFunc(...contextValues);
        } catch (error) {
            console.error('Condition evaluation error:', error);
            return false;
        }
    };

    // Queue system
    const queue: { nodeId: string, incomingData: any }[] = [];

    let initialPayload = { order_id: 'ORD-2024-001', amount: 8500 };

    // Parse initial input
    if (customInput) {
        try { initialPayload = JSON.parse(customInput); } catch (e) { }
    } else if ((startNode.data.config as any)?.devInput) {
        try { initialPayload = JSON.parse((startNode.data.config as any).devInput); } catch (e) { }
    }

    // Initial Data Context
    const globalContext = {
        payload: initialPayload,
        steps: {}
    };

    queue.push({
        nodeId: startNode.id,
        incomingData: { ...globalContext }
    });

    let steps = 0;
    const MAX_STEPS = 100;

    while (queue.length > 0 && steps < MAX_STEPS) {
        steps++;
        const currentItem = queue.shift();
        if (!currentItem) break;

        const { nodeId, incomingData } = currentItem;
        const node = nodes.find(n => n.id === nodeId);
        if (!node) continue;

        let isSuccess = true;
        let errorMessage = undefined;
        let outputData: Record<string, any> = {};

        // --- NODE EXECUTION LOGIC ---
        const config = (node.data.config || {}) as any;
        let nodeStartTime = Date.now(); // Track actual start time
        let duration = 0;
        let logInput: any = {};
        let logOutput: any = {};

        let targetArrayPath = '';
        let arrayData: any = [];

        if (node.type === WorkflowNodeType.LOOP) {
            // 1. Get Target Array
            targetArrayPath = (config as any).targetArray || '';
            
            // Remove 'payload.' prefix if exists for easier lookup in current context or use helper
            arrayData = getVariableValue(incomingData, targetArrayPath);

            const mode = config.mode || 'loop';
            const concurrency = config.concurrency || 10;

            // Log execution start with mode and parameters
            logs.push({
                stepId: `step-${Date.now()}-${steps}-loop-start`,
                nodeId: node.id,
                nodeType: node.type as WorkflowNodeType,
                nodeLabel: `${node.data.label} (开始执行)`,
                status: 'running',
                timestamp: new Date().toLocaleTimeString(),
                duration: 0,
                input: { 
                    mode: mode === 'iteration' ? '迭代模式 (并发)' : '循环模式 (顺序)',
                    concurrency: mode === 'iteration' ? concurrency : 'N/A',
                    targetArray: targetArrayPath,
                    arrayLength: Array.isArray(arrayData) ? arrayData.length : 0
                },
                output: { message: `开始以 ${mode === 'iteration' ? '并发' : '顺序'} 模式处理数据` }
            });

            if (!Array.isArray(arrayData)) {
                isSuccess = false;
                errorMessage = `循环目标不是数组: ${targetArrayPath} = ${JSON.stringify(arrayData)}`;
                outputData = { error: 'Invalid Array' };
            } else {
                // 2. Execution Logic
                const loopResults = [];
                const childNodes = nodes.filter(n => n.parentNode === node.id);

                if (childNodes.length > 0) {
                    const exportOutputVariable = config.exportOutput || '';
                    
                    if (mode === 'iteration') {
                        // --- ITERATION MODE (CONCURRENT) ---
                        // Simulate concurrent execution in chunks
                        for (let i = 0; i < arrayData.length; i += concurrency) {
                            const chunk = arrayData.slice(i, i + concurrency);
                            const chunkPromises = chunk.map(async (item, chunkIndex) => {
                                const actualIndex = i + chunkIndex;
                                const currentLoopContext = { 
                                    ...incomingData, 
                                    loop: { item: item, index: actualIndex } 
                                };

                                let iterationResult: any = null;

                                // Mock execution for each child in the chunk
                                childNodes.forEach(child => {
                                    // Prepare realistic mock output based on child type
                                    let mockOutput: any = { processed: true };
                                    if (child.type === WorkflowNodeType.LLM) {
                                        mockOutput = { text: `AI 处理了第 ${actualIndex + 1} 项数据: ${JSON.stringify(item)}`, response: { id: `iter-${actualIndex}` } };
                                    } else if (child.type === WorkflowNodeType.API_CALL) {
                                        mockOutput = { data: { result: 'success', item: item }, status: 200 };
                                    } else if (child.type === WorkflowNodeType.DATA_OP) {
                                        mockOutput = { result: item };
                                    }

                                    logs.push({
                                        stepId: `step-${Date.now()}-${steps}-iter${actualIndex}-${child.id}`,
                                        nodeId: child.id,
                                        nodeType: child.type as WorkflowNodeType,
                                        nodeLabel: `${child.data.label} (并发迭代 ${actualIndex + 1})`,
                                        status: 'success',
                                        timestamp: new Date().toLocaleTimeString(),
                                        duration: 5, // Shorter duration for concurrent mock
                                        input: { item: item },
                                        output: mockOutput,
                                        loopIndex: actualIndex
                                    });
                                    executionStatus[child.id] = 'success';
                                    
                                    // Store this output in a temporary context to evaluate exportOutput
                                    const tempContext = {
                                        ...currentLoopContext,
                                        nodes: { ...currentLoopContext.nodes, [child.id]: mockOutput }
                                    };

                                    // If this is the node we want to export from
                                    if (exportOutputVariable.includes(child.id)) {
                                        iterationResult = getVariableValue(tempContext, exportOutputVariable);
                                    }
                                });
                                
                                return iterationResult !== null ? iterationResult : { item, index: actualIndex };
                            });

                            const chunkResults = await Promise.all(chunkPromises);
                            loopResults.push(...chunkResults);
                        }
                    } else {
                        // --- LOOP MODE (SEQUENTIAL) ---
                        for (let i = 0; i < arrayData.length; i++) {
                            const item = arrayData[i];
                            const currentLoopContext = { 
                                ...incomingData, 
                                loop: { item: item, index: i } 
                            };

                            let iterationResult: any = null;

                            // Check termination condition
                            if (config.terminationConditions && config.terminationConditions.length > 0) {
                                const shouldTerminate = evaluateConditions(config.terminationConditions, undefined, currentLoopContext);
                                if (shouldTerminate) {
                                    logs.push({
                                        stepId: `step-${Date.now()}-${steps}-loop-terminated`,
                                        nodeId: node.id,
                                        nodeType: node.type as WorkflowNodeType,
                                        nodeLabel: `${node.data.label} (满足终止条件)`,
                                        status: 'success',
                                        timestamp: new Date().toLocaleTimeString(),
                                        duration: 0,
                                        input: { termination: 'triggered', index: i, condition: 'matched' },
                                        output: { message: 'Loop stopped by termination condition', stoppedAtIndex: i },
                                    });
                                    break;
                                }
                            }

                            // Sequential execution mock
                            childNodes.forEach(child => {
                                // Prepare realistic mock output based on child type
                                let mockOutput: any = { processed: true };
                                if (child.type === WorkflowNodeType.LLM) {
                                    mockOutput = { text: `AI 顺序处理了第 ${i + 1} 项数据: ${JSON.stringify(item)}`, response: { id: `loop-${i}` } };
                                } else if (child.type === WorkflowNodeType.API_CALL) {
                                    mockOutput = { data: { result: 'success', item: item }, status: 200 };
                                } else if (child.type === WorkflowNodeType.DATA_OP) {
                                    mockOutput = { result: item };
                                }

                                logs.push({
                                    stepId: `step-${Date.now()}-${steps}-loop${i}-${child.id}`,
                                    nodeId: child.id,
                                    nodeType: child.type as WorkflowNodeType,
                                    nodeLabel: `${child.data.label} (顺序循环 ${i + 1})`,
                                    status: 'success',
                                    timestamp: new Date().toLocaleTimeString(),
                                    duration: 10,
                                    input: { item: item },
                                    output: mockOutput,
                                    loopIndex: i
                                });
                                executionStatus[child.id] = 'success';

                                // Store this output in a temporary context to evaluate exportOutput
                                const tempContext = {
                                    ...currentLoopContext,
                                    nodes: { ...currentLoopContext.nodes, [child.id]: mockOutput }
                                };

                                // If this is the node we want to export from
                                if (exportOutputVariable.includes(child.id)) {
                                    iterationResult = getVariableValue(tempContext, exportOutputVariable);
                                }
                            });

                            loopResults.push(iterationResult !== null ? iterationResult : { item, index: i });
                        }
                    }
                    outputData = { result: loopResults };
                } else {
                    outputData = { message: 'No child nodes found in loop' };
                }
            }
            duration = Date.now() - nodeStartTime;

        } else if (node.type === WorkflowNodeType.SCRIPT) {
            // Simple script mock
            outputData = { result: "Script Executed" };
            duration = Date.now() - nodeStartTime;
        } else if (node.type === WorkflowNodeType.SQL) {
            // SQL Node Logic
            const rawSql = config.sql || '';
            const processedSql = processSQLTemplate(rawSql, incomingData);
            const databaseId = config.databaseId || 'default';
            
            // Mock SQL execution results
            let results: any = [];
            let affectedRows = 0;
            const isSelect = processedSql.toLowerCase().trim().startsWith('select');

            if (isSelect) {
                results = [
                    { id: 1, name: 'Sample User', email: 'user@example.com', created_at: '2024-01-01' },
                    { id: 2, name: 'Another User', email: 'test@example.com', created_at: '2024-01-02' }
                ];
                affectedRows = results.length;
            } else { 
                affectedRows = 1;
                results = { affectedRows: 1, success: true };
            }

            // Consistent output structure for variable discovery
            outputData = {
                data: isSelect ? (config.returnSingleRecord ? (results[0] || null) : results) : [],
                affectedRows: affectedRows,
                output: results,
                success: true,
                database: databaseId
            };

            duration = Math.floor(Math.random() * 50) + 10;
            isSuccess = true;

            logInput = {
                database_id: databaseId,
                original_sql: rawSql,
                processed_sql: processedSql,
                options: {
                    returnSingleRecord: config.returnSingleRecord,
                    unsafeMode: config.unsafeMode
                }
            };

            logOutput = {
                ...outputData,
                execution_time: duration
            };
        } else if (node.type === WorkflowNodeType.API_CALL) {
            // Build URL with query parameters
            let url = config.url || 'https://api.example.com';
            url = replaceVariables(url, incomingData);

            const enabledQueryParams = (config.queryParams || []).filter((param: any) => param.enabled);
            if (enabledQueryParams.length > 0) {
                const queryString = new URLSearchParams(
                    enabledQueryParams.map((param: any) => [
                        replaceVariables(param.key, incomingData),
                        replaceVariables(param.value, incomingData)
                    ])
                ).toString();
                url += (url.includes('?') ? '&' : '?') + queryString;
            }

            // Process headers
            const enabledHeaders = (config.headers || []).filter((header: any) => header.enabled && header.key && header.key.trim() !== '');
            const headersObj = enabledHeaders.reduce((acc: any, header: any) => {
                const key = replaceVariables(header.key, incomingData).trim();
                const value = replaceVariables(header.value, incomingData);
                // Validate header name (basic check for non-empty and no control chars)
                if (key && /^[a-zA-Z0-9-_]+$/.test(key)) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            // Process authentication
            const authConfig = config.auth || { type: 'none' };
            if (authConfig.type === 'basic') {
                const username = replaceVariables(authConfig.username || '', incomingData);
                const password = replaceVariables(authConfig.password || '', incomingData);
                const credentials = btoa(`${username}:${password}`);
                headersObj['Authorization'] = `Basic ${credentials}`;
            } else if (authConfig.type === 'bearer') {
                const token = replaceVariables(authConfig.token || '', incomingData);
                headersObj['Authorization'] = `Bearer ${token}`;
            } else if (authConfig.type === 'api_key') {
                const apiKey = replaceVariables(authConfig.apiKey || '', incomingData);
                const apiKeyName = replaceVariables(authConfig.apiKeyName || 'X-API-Key', incomingData);
                if (authConfig.apiKeyLocation === 'header') {
                    headersObj[apiKeyName] = apiKey;
                } else if (authConfig.apiKeyLocation === 'query') {
                    const apiKeyParam = `${apiKeyName}=${apiKey}`;
                    url += (url.includes('?') ? '&' : '?') + apiKeyParam;
                }
            }

            // Process body based on body type
            let requestBody = incomingData.payload;
            if (config.bodyType === 'json') {
                try {
                    const bodyStr = replaceVariables(config.body || '', incomingData);
                    requestBody = bodyStr ? JSON.parse(bodyStr) : requestBody;
                } catch (e) {
                    // Invalid JSON, use as is
                }
            } else if (config.bodyType === 'x-www-form-urlencoded') {
                try {
                    const bodyStr = replaceVariables(config.body || '', incomingData);
                    const formData = new URLSearchParams(bodyStr);
                    requestBody = formData.toString();
                } catch (e) {
                    // Invalid form data, use as is
                }
            } else if (config.body) {
                requestBody = replaceVariables(config.body, incomingData);
            }

            // REAL API Call execution
            let responseData: any = null;
            let responseStatus = 0;
            let responseHeaders: any = {};

            try {
                const method = config.method || 'GET';
                const fetchOptions: RequestInit = {
                    method: method,
                    headers: headersObj,
                };

                // FIX: Ensure body is NOT sent for GET or HEAD requests
                if (method !== 'GET' && method !== 'HEAD') {
                    if (config.bodyType === 'json') {
                        // Default to {} if requestBody is empty for JSON
                        fetchOptions.body = JSON.stringify(requestBody || {});
                        // Ensure Content-Type is set if not present
                        if (!headersObj['Content-Type']) {
                            fetchOptions.headers = { ...fetchOptions.headers, 'Content-Type': 'application/json' };
                        }
                    } else if (config.bodyType === 'x-www-form-urlencoded') {
                        fetchOptions.body = requestBody;
                        if (!headersObj['Content-Type']) {
                            fetchOptions.headers = { ...fetchOptions.headers, 'Content-Type': 'application/x-www-form-urlencoded' };
                        }
                    } else {
                        fetchOptions.body = requestBody;
                    }
                }

                const response = await fetch(url, fetchOptions);
                responseStatus = response.status;

                // Extract headers
                response.headers.forEach((value, key) => {
                    responseHeaders[key] = value;
                });

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    responseData = await response.json();
                } else {
                    responseData = await response.text();
                }

                isSuccess = response.ok;
                if (!response.ok) {
                    errorMessage = `API Error: ${response.status} ${response.statusText}`;
                }

            } catch (error) {
                isSuccess = false;
                errorMessage = error instanceof Error ? error.message : String(error);
                responseStatus = 0;
                responseData = null;
            }

            duration = Date.now() - nodeStartTime;

            // Apply response handling
            let processedResponse = responseData;
            if (config.responseHandling?.extractPath && responseData) {
                try {
                    // Simple dot notation extraction
                    const pathParts = config.responseHandling.extractPath.split('.');
                    processedResponse = pathParts.reduce((acc: any, part: string) => {
                        return acc ? acc[part] : acc;
                    }, responseData);
                } catch (e) {
                    // Extraction failed, use full response
                }
            }

            logInput = {
                api_url: url,
                method: config.method || 'GET',
                headers: headersObj,
                body: requestBody,
                bodyType: config.bodyType || 'none',
                timeout: config.timeout || 30000,
                retryConfig: config.retry || { enabled: false }
            };
                
            // Ensure outputData is populated for downstream nodes
            outputData = {
                status: responseStatus,
                data: processedResponse,
                response: processedResponse, // Compatibility alias
                headers: responseHeaders,
                raw_data: responseData
            };

            logOutput = {
                status: responseStatus,
                data: processedResponse,
                response: processedResponse, // Compatibility alias
                headers: responseHeaders,
                response_time: duration,
                originalUrl: config.url || 'https://api.example.com',
                error: errorMessage
            };
        } else if (node.type === WorkflowNodeType.CONDITION) {
            // 条件节点处理
            const conditionResult = evaluateConditions(config.conditionGroups, config.expression, incomingData);
            isSuccess = !!conditionResult;
            duration = Date.now() - nodeStartTime;

            // 增强条件节点的输入输出监控
            logInput = {
                expression: config.expression || 'builder',
                condition_groups: config.conditionGroups || [],
                data: incomingData.payload,
                context_data: incomingData.nodes || {},
                workflow_context: {
                    step_count: steps,
                    timestamp: new Date(nodeStartTime).toISOString()
                }
            };

            logOutput = {
                result: isSuccess,
                next_path: isSuccess ? 'true' : 'false',
                condition_result: conditionResult,
                evaluation_context: {
                    payload_keys: Object.keys(incomingData.payload),
                    has_context_data: Object.keys(incomingData.nodes || {}).length > 0
                },
                metrics: {
                    processing_time: duration
                }
            };

        } else if (node.type === WorkflowNodeType.APPROVAL) {
            // 增强审批节点的输入数据监控
            logInput = {
                approvers: config.approver || 'manager',
                approval_type: config.approvalType || 'single',
                approval_strategy: config.approvalStrategy || 'all',
                timeout: `${config.timeout || 24} ${config.timeoutUnit || 'hours'}`,
                form_title: config.formTitle || '审批单',
                field_config: config.fieldConfig || {},
                button_config: config.buttonConfig || {},
                request: incomingData.payload, // 完整的请求数据
                context_data: incomingData.nodes || {}, // 上游节点的输出数据
                workflow_context: {
                    step_count: steps,
                    timestamp: new Date(nodeStartTime).toISOString()
                }
            };

            duration = Math.floor(Math.random() * 200) + 20; // Approval still mocks time

            // 增强审批节点的输出数据监控
            logOutput = {
                approved: isSuccess,
                comment: isSuccess ? 'Approved' : 'Rejected',
                approver: config.approver || 'manager',
                approval_time: `${duration}ms`,
                approval_duration: duration,
                form_title: config.formTitle || '审批单',
                original_request: incomingData.payload, // 保留原始请求数据
                processed_data: {
                    ...incomingData.payload, // 处理后的数据，这里简单复制，实际会根据审批结果修改
                    approval_result: isSuccess ? 'approved' : 'rejected',
                    approval_time: new Date(nodeStartTime).toISOString(),
                    approver: config.approver || 'manager'
                },
                notifications: {
                    approval_notice_sent: config.sendApprovalNotice !== false,
                    timeout_notice_sent: config.sendTimeoutNotice !== false,
                    recipients: config.noticeRecipient || 'requester'
                },
                metrics: {
                    processing_time: duration,
                    step_number: steps
                }
            };
        } else if (node.type === WorkflowNodeType.KNOWLEDGE_RETRIEVAL) {
            // 知识库检索模拟逻辑
            const query = replaceVariables(config.query || '', incomingData);
            const datasetIds = config.dataset_ids || [];
            
            // Mock 检索结果
            const mockReferences = [
                { 
                    id: 'seg_1', 
                    content: `这是关于 ${query} 的第一条相关知识分段内容。`, 
                    score: 0.92,
                    title: '产品文档 A'
                },
                { 
                    id: 'seg_2', 
                    content: `关于 ${query} 的第二条参考信息，补充了更多细节。`, 
                    score: 0.85,
                    title: '技术规范 B'
                }
            ];
            
            const result = mockReferences.map(r => r.content).join('\n\n');
            const context = `以下是根据您的查询 "${query}" 检索到的相关知识：\n\n${result}`;
            
            outputData = {
                result: result,
                context: context,
                references: mockReferences
            };
            
            duration = Math.floor(Math.random() * 500) + 200; // 模拟检索耗时
            isSuccess = datasetIds.length > 0;
            if (!isSuccess) errorMessage = "未选择任何知识库";
            
            logInput = { query, dataset_ids: datasetIds };
            logOutput = outputData;

        } else if (node.type === WorkflowNodeType.DOCUMENT_EXTRACTOR) {
            // 文档提取器模拟逻辑
            const fileUrl = replaceVariables(config.file_url || '', incomingData);
            const mode = config.extraction_mode || 'text';
            
            // Mock 提取结果
            const mockText = `[模拟提取自: ${fileUrl}]\n\n这是从文档中提取出的纯文本内容。提取模式：${mode}。\n\n文档包含多段文字，这里模拟了提取后的完整文本输出。`;
            
            outputData = {
                text: mockText
            };
            
            duration = Math.floor(Math.random() * 300) + 100; // 模拟解析耗时
            isSuccess = !!fileUrl;
            if (!isSuccess) errorMessage = "未提供有效的文件URL";
            
            logInput = { file_url: fileUrl, mode };
            logOutput = outputData;

        } else if (node.type === WorkflowNodeType.END) {
            // 处理结束节点：根据配置的输出变量提取数据
            const outputs = config.outputs || [];
            const finalOutput: Record<string, any> = {};

            if (Array.isArray(outputs) && outputs.length > 0) {
                outputs.forEach((item: any) => {
                    if (item.key && item.value) {
                        // 使用 getVariableValue 提取变量值，它会自动处理 {{}}
                        finalOutput[item.key] = getVariableValue(incomingData, item.value);
                    }
                });
                outputData = finalOutput;
            } else {
                // 如果未配置输出，默认返回当前的 payload
                outputData = incomingData.payload;
            }

            duration = 10;
            logInput = incomingData.payload;
            logOutput = outputData;

        } else {
            // For other node types, use simplified input/output
            // duration = Math.floor(Math.random() * 200) + 20; // Removed default mock duration
            duration = Date.now() - nodeStartTime;
            if (duration < 20) duration = 20; // Minimum visual duration

            outputData = { processed: true };
        }

        // Log the main node (Loop itself or others) with realistic input/output
        // (Note: Variables logInput and logOutput were populated inside specific blocks above for complex nodes)

        // Set realistic input based on node type if not already set
        if (node.type === WorkflowNodeType.START) {
            logInput = incomingData.payload; // Start node receives the payload directly
            logOutput = { ...incomingData.payload }; // REAL Output for Start Node
            outputData = { ...incomingData.payload }; // Ensure data flows
            duration = 10;
        } else if (!logInput || Object.keys(logInput).length === 0) {
            // Fallback for nodes that didn't set logInput
            logInput = incomingData.payload;
            logOutput = outputData;
        }


        // Add error information if failed
        if (!isSuccess && errorMessage) {
            logOutput = {
                ...logOutput,
                error: errorMessage
            };
        }

        logs.push({
            stepId: `step-${Date.now()}-${steps}-${node.id}`,
            nodeId: node.id,
            nodeType: node.type as WorkflowNodeType,
            nodeLabel: node.data.label,
            status: isSuccess ? 'success' : 'failed',
            timestamp: new Date(nodeStartTime).toLocaleTimeString(),
            duration: duration,
            input: logInput, // Realistic input
            output: logOutput, // Realistic output
            errorMessage: errorMessage
        });

        // Store node output for later use
        nodeOutputs[node.id] = logOutput;

        executionStatus[node.id] = isSuccess ? 'success' : 'failed';

        // Continue traversal
        if (isSuccess) {
            const nextData = {
                ...incomingData,
                steps: { ...incomingData.steps, [node.id]: outputData },
                nodes: { ...incomingData.nodes, [node.id]: logOutput } // Add node outputs to context
            };

            const outgoingEdges = edges.filter(e => e.source === nodeId);
            outgoingEdges.forEach(edge => {
                // Avoid adding nodes that are inside the loop if we are currently "outside" processing
                // But here edges are explicit.
                queue.push({ nodeId: edge.target, incomingData: nextData });
            });
        }
    }

    return { logs, executionStatus, nodeOutputs };
};
