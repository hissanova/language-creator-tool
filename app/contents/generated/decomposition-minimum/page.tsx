import { ViewerSwitcher } from "@/app/components/ViewerSwitcher";

import { decompositionMinimumGenerated } from "@/samples/core-json/generated/decomposition-minimum.generated";

export default function SampleAnnotationPage() {
  return <ViewerSwitcher document={decompositionMinimumGenerated} />;
}
  