import { ViewerSwitcher } from "@/app/components/ViewerSwitcher";
import { viewerConversationSmokeGenerated } from "@/samples/core-json/generated/viewer-conversation-smoke.generated";


export default function SampleLessonPage() {
  return <ViewerSwitcher document={viewerConversationSmokeGenerated} />;
}
