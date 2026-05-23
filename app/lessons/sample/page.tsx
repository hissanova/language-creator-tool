import { LessonViewer } from "../../components/LessonViewer";
import { sampleLesson } from "../../data/sampleLesson";

export default function SampleLessonPage() {
  return <LessonViewer lesson={sampleLesson} />;
}