import { ContentsViewer } from "../../components/ContentsViewer";
import { sampleLesson } from "../../data/sampleLesson";
import { sampleDocument } from "@/app/data/sampleDocument";

export default function SampleLessonPage() {
  return <ContentsViewer document={sampleDocument} />;
}