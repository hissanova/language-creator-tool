import { sampleLesson } from "../../data/sampleLesson";
import { LessonViewer } from "../../components/LessonViewer";

export default function SampleLessonPage() {
  return <LessonViewer lesson={sampleLesson} />;
}