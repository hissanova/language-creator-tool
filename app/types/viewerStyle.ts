export type ViewerStyle = {
  layout: {
    main: string;
    headerTitle: string;
    controls: string;
    section: string;
    sectionHeader: string;
    sectionTitle: string;
    sectionTime: string;
    playButton: string;
    lines: string;
  };
  speaker: {
    default: {
      container: string;
      name: string;
    };
    colors: Record<
      string,
      {
        container: string;
        name: string;
      }
    >;
  };
  text: {
    line: string;
    annotated: string;
    annotationWithoutPopup: string;
    translation: string;
    form: string;
    targetBlock: string;
    annotationBox: string;
    annotationTitle: string;
  };
  resource: {
    figure: string;
    image: string;
    caption: string;
  };
};
