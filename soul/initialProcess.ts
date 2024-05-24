
import { MentalProcess, useActions, usePerceptions, useProcessManager, useSoulMemory, indentNicely } from "@opensouls/engine";
import externalDialog from "./cognitiveSteps/externalDialog.js";
import internalMonologue from "./cognitiveSteps/internalMonologue.js";
import monitor from "./mentalProcesses/monitor.js";

type InstanceMetrics = {
  instanceId: string;
  status: 'healthy' | 'unhealthy';
  requestCount: number;
  errorCount: number;
  responseTimeAvg: number; // in milliseconds
  cpuUtilization: number; // in percentage
  memoryUtilization: number; // in percentage
};

type LatencyMetrics = {
  p50: number; // 50th percentile latency in milliseconds
  p90: number; // 90th percentile latency in milliseconds
  p99: number; // 99th percentile latency in milliseconds
};

type HealthCheck = {
  status: 'pass' | 'fail';
  details: string;
};

type LoadBalancerMetrics = {
  timestamp: string; // ISO 8601 format
  loadBalancerId: string;
  region: string;
  instances: InstanceMetrics[];
  totalRequestCount: number;
  totalErrorCount: number;
  responseTimeAvg: number; // in milliseconds
  cpuUtilizationAvg: number; // in percentage
  memoryUtilizationAvg: number; // in percentage
  activeConnections: number;
  droppedConnections: number;
  latency: LatencyMetrics;
  throughput: number; // in requests per second
  errorRate: number; // errors per request
  healthCheck: HealthCheck;
};


function generateLogSummary(logEvent: LoadBalancerMetrics) {
  const {
      timestamp,
      loadBalancerId,
      region,
      instances,
      totalRequestCount,
      totalErrorCount,
      responseTimeAvg,
      cpuUtilizationAvg,
      memoryUtilizationAvg,
      activeConnections,
      droppedConnections,
      latency,
      throughput,
      errorRate,
      healthCheck
  } = logEvent;

  const instanceSummaries = instances.map(instance => {
      return `Instance ${instance.instanceId} is ${instance.status}. It handled ${instance.requestCount} requests with ${instance.errorCount} errors. The average response time was ${instance.responseTimeAvg} ms. CPU utilization is at ${instance.cpuUtilization}% and memory utilization is at ${instance.memoryUtilization}%.`;
  }).join(' ');

  return `At ${timestamp}, load balancer ${loadBalancerId} in the ${region} region had the following metrics: 
  Total request count: ${totalRequestCount}, 
  Total error count: ${totalErrorCount}, 
  Average response time: ${responseTimeAvg} ms, 
  Average CPU utilization: ${cpuUtilizationAvg}%, 
  Average memory utilization: ${memoryUtilizationAvg}%, 
  Active connections: ${activeConnections}, 
  Dropped connections: ${droppedConnections}, 
  Latency percentiles - P50: ${latency.p50} ms, P90: ${latency.p90} ms, P99: ${latency.p99} ms, 
  Throughput: ${throughput} requests per second, 
  Error rate: ${(errorRate * 100).toFixed(2)}%, 
  Health check status: ${healthCheck.status} (${healthCheck.details}). 
  ${instanceSummaries}`;
}

const initializeAndMonitor: MentalProcess = async ({ workingMemory }) => {
  const { speak, log  } = useActions()
  const { invocationCount } = useProcessManager()
  const { invokingPerception, pendingPerceptions } = usePerceptions();

  const previousLog = useSoulMemory<string>("previousLog", "N/A");
  
  const userName = useSoulMemory("userName", "")
  const dataStream = useSoulMemory("dataStream", "")
  
  //copy the most recent workingMemory entry
  // const currentLog:any = workingMemory[workingMemory.length - 1];

  if (invocationCount === 0) {
  //   // On first message
  //   log("New Data Stream connected to Defender");
  
  //   const [withInitialThought, intro] = await internalMonologue(
  //     workingMemory,
  //     `Hello Defender, you have just been tasked with monitoring a new data stream. Analyze the incoming data to set a starting point, but do not interact with the user yet.`,
  //   );
      const [withInitialThought, intro] = await internalMonologue(
        workingMemory,
        `Hello Defender, you have just been tasked with monitoring a new data stream. Introduce yourself, ask as for the user's name, and see if they need any help setting up the data stream.`,
      );

  //   log(JSON.stringify(workingMemory, null, 2));

  //   return withInitialThought;
  }


  if (invokingPerception?.action === "logged") {
    const content = invokingPerception.content;
    // const message = `Logged: ${content}`;
    // await speak(message);
    // log(message);
    const [withMonologue,] = await internalMonologue(
      workingMemory,
      "Take a look at the latest metrics and see if anything looks off",
    );
  
    return [withMonologue, monitor];
  }

  const [withDialog, result] = await externalDialog(
    workingMemory,
    "Shoot the shit with the user to learn about your assignment",
  );

  speak(result)

  return withDialog;
  
}

export default initializeAndMonitor
