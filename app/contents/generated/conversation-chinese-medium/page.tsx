import { ViewerSwitcher } from "@/app/components/ViewerSwitcher";
import { conversationSampleChinese2 } from "@/samples/conversation-zh-episode/core-json/sample-episode-zh-reduced";


export default function SampleLessonPage() {
  return <ViewerSwitcher document={conversationSampleChinese2} />;
}
