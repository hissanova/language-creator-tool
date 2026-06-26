import { ViewerSwitcher } from "@/app/components/ViewerSwitcher";
import { viewerConversationSmoke } from "@/samples/core-json/viewer-conversation-smoke";


export default function SampleLessonPage() {
  return <ViewerSwitcher document={viewerConversationSmoke} />;
}
