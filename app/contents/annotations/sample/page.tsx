import { ViewerSwitcher } from "@/app/components/ViewerSwitcher";

import { sample } from "@/samples/core-json/decomposition-minimum";

export default function SampleAnnotationPage() {
  return <ViewerSwitcher document={sample} />;
}
