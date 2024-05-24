
import { ChatMessageRoleEnum, MentalProcess, WorkingMemory, useActions, usePerceptions, useProcessManager, useSoulMemory, indentNicely } from "@opensouls/engine";
import externalDialog from "../cognitiveSteps/externalDialog.js";
import internalMonologue from "../cognitiveSteps/internalMonologue.js";
import decision from "../cognitiveSteps/decision.js";
import observation from "../cognitiveSteps/observation.js";

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
  defenderReasoning: string;
  suggestedDuration: number;
  metrics: ObservationMetric[];
  totalObservations: number;
  additionalInfo?: string; // Any additional information or context
};



const monitor: MentalProcess = async ({ workingMemory }) => {
  const { speak, log  } = useActions()
  const { invocationCount } = useProcessManager()
  const { invokingPerception, pendingPerceptions } = usePerceptions();
  
  const userName = useSoulMemory("userName", "")
  const dataStream = useSoulMemory("dataStream", "")
  const previousLog = useSoulMemory("previousLog", "...")
  // const currentObservations = useSoulMemory<string[]>("currentObservations", []);
  
  if (invokingPerception?.action === "logged") {
    const content = invokingPerception.content;

    const [withMonologue, dataThought] = await internalMonologue(
      workingMemory,
      "Take a look at the latest metrics and see if anything looks off or different from the previous log.",
    );
    log(`Defender thinks: ${dataThought}`)

    const [useAction, action] = await decision(withMonologue, {
      description: indentNicely`
        Based on your analysis which of the following actions should Defender proceed with?

        Do Nothing: This should be selected if the data stream is normal and no action is required.
        Start Observation: This should be selected if the data stream is abnormal and Defender needs to observe the data stream for a while. Observations MUST be started before an escalation can be initiated.
        Start Escalation: This should be selected if an Observation's status has not improved for long enough time.
      `,
      choices: ["do_nothing", "start_observation"]
    },
    { model: "fast" }
    );

    // const [withDecision, decisionResult] = await decision(
    //   withMonologue,
    //   {
    //     description: "Defender wants to alert the user to something",
    //     choices: ["Yes", "No"],
    //   }
    // );
    // log(`Defender decides: ${decisionResult}`)
    log(`Defender chooses: ${action}`)
    if (action === "start_observation") {
      const [withObservation, observationResult] = await observation(
        withMonologue,
        {
          prevLog: previousLog.current,
          curLog: content,
        }
      );
      log(`Defender starts observation: ${observationResult}`)
      return withObservation;
    }
    // if (decisionResult === "Yes") {
    //   const [withDialog, dialogResult] = await externalDialog(
    //     withDecision,
    //     "Defender wants to alert the user to something",
    //   );
    //   speak(dialogResult)
    //   return withDialog;
    // } 
    previousLog.current = invokingPerception?.content || "..."
    return workingMemory;
  } else {
    // log("SENDING MESSAGES")
    const [withDialog, result] = await externalDialog(
      workingMemory,
      "answer the user's questions and help investigate and troubleshoot the data stream abnormality",
    );
    speak(result)
    return withDialog;
  }

  
  return workingMemory;
}

export default monitor
