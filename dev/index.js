import { Soul, said } from "@opensouls/soul"
 
// Create a new Soul instance with a new unique identifier
const soul = new Soul({
  soulId: "defender-test-4",
  organization: "Foxxdie",
  blueprint: "defender",
  token: "dfc38b83-812c-49b0-9f12-79fc2f83b316", // npx soul-engine apikey
  debug: true, // this is new
})
 
// Listen for responses from the soul
soul.on("says", async ({ content }) => {
  console.log("Defender said", await content())
})
 
// Connect the soul to the engine
soul.connect().then(async () => {
  // Send a greeting to the soul
  // soul.dispatch(said("User", "Hi!"))
  soul.dispatch({
    name: "DataStream",
    action: "logged",
    content: JSON.stringify(loadBalancerMetrics),
  })
})


const loadBalancerMetrics = {
  timestamp: new Date().toISOString(),
  loadBalancerId: "lb-123456",
  region: "us-east-1",
  instances: [
      {
          instanceId: "i-abcdef01",
          status: "healthy",
          requestCount: 1500,
          errorCount: 5,
          responseTimeAvg: 200, // in milliseconds
          cpuUtilization: 75, // in percentage
          memoryUtilization: 65 // in percentage
      },
      {
          instanceId: "i-abcdef02",
          status: "healthy",
          requestCount: 1200,
          errorCount: 2,
          responseTimeAvg: 210, // in milliseconds
          cpuUtilization: 70, // in percentage
          memoryUtilization: 60 // in percentage
      }
  ],
  totalRequestCount: 2700,
  totalErrorCount: 7,
  responseTimeAvg: 205, // in milliseconds
  cpuUtilizationAvg: 72.5, // in percentage
  memoryUtilizationAvg: 62.5, // in percentage
  activeConnections: 150,
  droppedConnections: 3,
  latency: {
      p50: 200, // 50th percentile latency in milliseconds
      p90: 250, // 90th percentile latency in milliseconds
      p99: 300  // 99th percentile latency in milliseconds
  },
  throughput: 1000, // in requests per second
  errorRate: 0.0026, // errors per request
  healthCheck: {
      status: "pass",
      details: "All instances are healthy"
  }
};
