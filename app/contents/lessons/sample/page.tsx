import { ViewerSwitcher } from "@/app/components/ViewerSwitcher";
import { conversation } from "@/samples/core-json/conversation-hyq_2026-04-16_xindeyanjing_EDITED-BY-SIMON";


export default function SampleLessonPage() {
  return <ViewerSwitcher document={conversation} />;
}
