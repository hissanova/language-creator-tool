import { ViewerSwitcher } from "@/app/components/ViewerSwitcher";

import { sampleDocument } from "@/app/data/sampleGrammarAnnotations";

export default function SampleAnnotationPage() {
  return <ViewerSwitcher document={sampleDocument} />;
}
