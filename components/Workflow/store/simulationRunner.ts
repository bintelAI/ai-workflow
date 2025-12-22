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
        if (!path) return undefined;
        // Handle 'loop.item' special case handled inside the loop logic
        if (path === 'payload') return obj.payload;

        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }
        return current;
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

            if (!Array.isArray(arrayData)) {
                isSuccess = false;
                errorMessage = `循环目标不是数组: ${targetArrayPath} = ${JSON.stringify(arrayData)}`;
                outputData = { error: 'Invalid Array' };
            } else {
                // 2. Iterate
                const loopResults = [];
                // Find start nodes inside the loop (nodes with no incoming edges FROM INSIDE the loop)
                // For simplicity in this flat simulation, we just find nodes with parentNode === loop.id
                // And we assume a linear execution inside for the demo, or just "process" them.

                const childNodes = nodes.filter(n => n.parentNode === node.id);

                if (childNodes.length > 0) {
                    // We will simulate the loop by creating virtual logs for children
                    // NOTE: A real recursive engine is complex. We will mock the children execution here.

                    for (let i = 0; i < arrayData.length; i++) {
                        const item = arrayData[i];
                        // const loopContext = { ...incomingData, loop: { item: item, index: i } };

                        // Mock execution of children
                        childNodes.forEach(child => {
                            logs.push({
                                stepId: `step-${Date.now()}-${steps}-loop${i}-${child.id}`,
                                nodeId: child.id,
                                nodeType: child.type as WorkflowNodeType,
                                nodeLabel: `${child.data.label} (Item ${i + 1})`,
                                status: 'success',
                                timestamp: new Date(nodeStartTime).toLocaleTimeString(),
                                duration: 10,
                                input: { item: item },
                                output: { processed: true },
                                loopIndex: i
                            });
                            executionStatus[child.id] = 'success';
                        });

                        loopResults.push({ index: i, result: 'processed' });
                    }
                }
                outputData = { loop_results: loopResults, count: arrayData.length };
            }
            duration = Date.now() - nodeStartTime;

        } else if (node.type === WorkflowNodeType.SCRIPT) {
            // Simple script mock
            outputData = { result: "Script Executed" };
            duration = Date.now() - nodeStartTime;
        } else if (node.type === WorkflowNodeType.API_CALL) {
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
                    // Return original match if variable not found
                    return match;
                });
            };

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
            const expression = config.expression || 'true';

            // 执行条件表达式
            let conditionResult = false;
            try {
                // 使用Function构造器执行条件表达式，传入上下文
                const evalContext = {
                    ...incomingData.payload,
                    ...incomingData.steps,
                    ...incomingData.nodes,
                    payload: incomingData.payload
                };

                // 构建函数体，将上下文变量作为参数传入
                const funcBody = `return ${expression};`;
                const conditionFunc = new Function(...Object.keys(evalContext), funcBody);
                conditionResult = conditionFunc(...Object.values(evalContext));

                // 更新isSuccess为条件结果
                isSuccess = !!conditionResult;
            } catch (error) {
                isSuccess = false;
                errorMessage = `条件表达式执行错误: ${error instanceof Error ? error.message : String(error)}`;
                console.error('条件表达式执行错误:', error);
            }

            duration = Date.now() - nodeStartTime;

            // 增强条件节点的输入输出监控
            logInput = {
                expression: expression,
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
                condition_expression: expression,
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
        } else if (node.type === WorkflowNodeType.END) {
            // 处理结束节点：根据配置的输出变量提取数据
            const outputs = config.outputs || [];
            const finalOutput: Record<string, any> = {};

            if (Array.isArray(outputs) && outputs.length > 0) {
                outputs.forEach((item: any) => {
                    if (item.key && item.value) {
                        // Clean up variable syntax {{...}} if present
                        let path = item.value;
                        if (typeof path === 'string') {
                             path = path.replace(/^{{\s*/, '').replace(/\s*}}$/, '');
                        }
                        // 使用 getVariableValue 提取变量值
                        finalOutput[item.key] = getVariableValue(incomingData, path);
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
