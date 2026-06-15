import { DocumentViewer } from "@/app/components/DocumentViewer";
import { sampleDocument } from "@/app/data/sampleGrammarAnnotations";

export default function SampleAnnotationPage() {
  return <DocumentViewer document={sampleDocument} />;
}
