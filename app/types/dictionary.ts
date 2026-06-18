export type Id = string;
export type LanguageId = string;
export type FormTypeId = string;
export type DictionaryRef = string;

export type Dictionary = {
  id: Id;
  title: string;
  language: LanguageId;
  version?: string;
  description?: string;
  license?: LicenseInfo;
  source?: SourceInfo;
  entries: DictionaryEntry[];
};

export type DictionaryEntry = {
  id: Id;

  // Canonical lexical form
  lemma: DictionaryForm;

  // Variants, search keys, stems, inflected forms, etc.
  forms: DictionaryForm[];

  pos?: PartOfSpeech[];

  // Entry-level meanings
  senses: Sense[];

  // Entry-level morphology / conjugation knowledge
  morphology?: Morphology;

  // Optional syntax / construction knowledge
  syntaxPatterns?: SyntaxPattern[];

  notes?: string[];
  tags?: string[];
  source?: SourceInfo;
};

export type DictionaryForm = {
  text: string;
  formType?: FormTypeId; // kana, pinyin, zhuyin, phoneme, ipa, etc.
  role: FormRole;
  source?: FormSource;
  variety?: string; // heimin, shizoku, dialect/register/etc.
};

export type FormRole =
  | "lemma"
  | "variant"
  | "searchKey"
  | "surface"
  | "inflected"
  | "stem"
  | "affix";

export type FormSource =
  | "original"
  | "manual"
  | "generated"
  | "normalized"
  | "imported";

export type PartOfSpeech = {
  value: string;
  language?: LanguageId;
  source?: string;
  note?: string;
};

export type Sense = {
  id: Id;

  // Popup-friendly meanings
  meanings: Meaning[];

  // Longer explanations
  definitions?: Definition[];

  examples?: Example[];
  notes?: string[];
  tags?: string[];

  relations?: SenseRelation[];

  // Sense-specific morphology notes only
  morphologyNotes?: string[];

  source?: SourceInfo;
};

export type Meaning = {
  lang: LanguageId;
  text: string;
  style?: "short" | "full" | "popup";
};

export type Definition = {
  lang: LanguageId;
  text: string;
};

export type Example = {
  id?: Id;
  text: string;
  lang: LanguageId;
  translations?: Translation[];
  source?: SourceInfo;
};

export type Translation = {
  lang: LanguageId;
  text: string;
};

export type Morphology = {
  type: "verb" | "noun" | "adjective" | "particle" | "affix" | "other";
  conjugationClass?: string;

  // e.g. basic, continuative, euphonic, negative, stem
  stems?: Record<string, DictionaryForm>;

  // Generated or listed inflected forms searchable by auto scan
  forms?: InflectedForm[];

  // Optional reusable decomposition patterns
  decompositionPatterns?: DecompositionPattern[];

  notes?: string[];
  source?: SourceInfo;
};

export type InflectedForm = {
  form: DictionaryForm;

  // Human-readable label, e.g. "teen-form", "tooN-form", "nonpast"
  label?: string;

  // Machine-readable features, preferably stable strings
  features?: MorphologicalFeature[];

  // Optional decomposition for auto decomposition candidates
  decomposition?: DecompositionPattern;

  source?: FormSource;
};

export type MorphologicalFeature = string;

export type DecompositionPattern = {
  id?: Id;

  // Surface or generated decomposition sequence
  components: DecompositionComponent[];

  label?: string;
  features?: MorphologicalFeature[];
  notes?: string[];
  source?: SourceInfo;
};

export type DecompositionComponent = {
  form: DictionaryForm;

  // Optional reference to entry/sense/stem/morpheme
  ref?: DictionaryRef;

  // Useful for things like stem, suffix, particle, aspect marker
  role?: ComponentRole;

  meanings?: Meaning[];
  pos?: PartOfSpeech[];
  tags?: string[];
};

export type ComponentRole =
  | "root"
  | "stem"
  | "prefix"
  | "suffix"
  | "particle"
  | "auxiliary"
  | "aspectMarker"
  | "tenseMarker"
  | "caseMarker"
  | "other";

export type SyntaxPattern = {
  id?: Id;
  label: string;

  // Simple first draft; can be expanded later
  pattern: string;

  meanings?: Meaning[];
  notes?: string[];
  tags?: string[];
  source?: SourceInfo;
};

export type SenseRelation = {
  type: string;
  target: DictionaryRef;
  note?: string;
};

export type LicenseInfo = {
  name?: string;
  url?: string;
  note?: string;
};

export type SourceInfo = {
  id?: Id;
  title?: string;
  url?: string;
  citation?: string;
  page?: string;
  note?: string;
};

export type DictionarySearchIndex = {
  dictionaryId: Id;
  keys: DictionarySearchKey[];
};

export type DictionarySearchKey = {
  key: string;
  entryId: Id;
  senseId?: Id;
  formRole?: FormRole;

  // If matched key is an inflected form
  inflectedFormLabel?: string;
  features?: MorphologicalFeature[];

  // If this match can propose @decompose
  decompositionPatternId?: Id;

  source?: FormSource;
};