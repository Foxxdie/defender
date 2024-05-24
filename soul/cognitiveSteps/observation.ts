import { createCognitiveStep, WorkingMemory, ChatMessageRoleEnum, indentNicely, stripEntityAndVerb, stripEntityAndVerbFromStream, z, useSoulMemory } from "@opensouls/engine";
import { v4 as uuidv4 } from 'uuid';

type ObservationMetric = {
  name: string; // Name of the metric
  startingValue: number; // What was the value of the metric when the observation was created
  threshold: string; // natural language threshold for the metric
}

type Observation = {
  id: string; // Unique identifier for the observation
  timestamp: Date; // Time when the observation was created
  previousLog: string;
  offendingLog: string;
  description: string; // Description of the observation
  reasoning: string;
  suggestedDuration: number;
  metrics?: ObservationMetric[];
  totalObservations: number;
  additionalInfo?: string; // Any additional information or context
};


const observation = createCognitiveStep(({ prevLog, curLog }: { prevLog: string, curLog: string }) => {
  const params = z.object({
    title: z.string().describe(`A short, human-efficient title of the observation.`),
    description: z.string().describe(`A detailed description of the observation.`),
    reasoning: z.string().describe(`The reasoning behind the defender's decision to start this observation`),
    suggestedDuration: z.number().describe(`The suggested duration of the observation in minutes.`),
    additionalInfo: z.string().optional().describe(`Any additional information or context for the observation.`),
  });

  return {
    schema: params,
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        name: name,
        content: indentNicely`
          ${name} has seen an abnormality in the logs and has decided to start an observation.

          ## PREVIOUS LOG
          ${prevLog}

          ## OFFENDING LOG
          ${curLog}

          Please provide the following information:
          1. The title of the Observation.
          2. The description of the Observation.
          3. ${name}'s reasoning for starting this observation.
          4. ${name}'s suggested duration for the observation.
          5. (Optional) Any additional notes

          Reply with the title, description, reasoning, suggestedDuration, and optionally additionalInfo for the new Observation.

        `
      };
    },
    streamProcessor: stripEntityAndVerbFromStream,
    postProcess: async (memory: WorkingMemory, response: z.output<typeof params>) => {
      // const stripped = stripEntityAndVerb(memory.soulName, verb, response.decision.toString());
      const observations = useSoulMemory<Observation[]>("observations", []);

      const newObservation: Observation = {
        id: uuidv4(),
        timestamp: new Date(),
        previousLog: prevLog,
        offendingLog: curLog,
        ...response,
        totalObservations: 0
      }

      observations.current.push(newObservation);

      const content = `${memory.soulName} started a new observation: "${response.title}" for ${response.suggestedDuration} minutes.`;

      const newMemory = {
        role: ChatMessageRoleEnum.Assistant,
        content
      };
      return [newMemory, content];
    }
  }
});

export default observation