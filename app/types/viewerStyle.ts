export type TagTextDisplayStyle = {
  label?: string;
  className?: string;
  style?: {
    fontStyle?: "normal" | "italic";
    fontWeight?: "normal" | "bold" | number;
    textDecoration?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
  };
};

export type TagDisplayStyle = TagTextDisplayStyle;

export type SpeakerDisplayStyle = {
  nameColor?: string;
  className?: string;
  style?: {
    color?: string;
  };
};

export type ViewerStyle = {
  tags?: Record<string, TagTextDisplayStyle>;
  speakers?: Record<string, SpeakerDisplayStyle>;
  layout: {
    main: string;
    headerTitle: string;
    mediaBar: string;
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
    languageSwitch: string;
    languageBadge: string;
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
