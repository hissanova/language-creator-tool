import { ViewerSwitcher } from "@/app/components/ViewerSwitcher";

import { decompositionNestedMinimumGenerated } from "@/samples/core-json/generated/decomposition-nested-minimum.generated";

export default function SampleAnnotationPage() {
  return <ViewerSwitcher document={decompositionNestedMinimumGenerated} />;
}
