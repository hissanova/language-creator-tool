# LCM Dictionary Specification

Version: 0.1-alpha

Status: Draft

---

# 1. Overview

LCM Dictionary is an external lexical resource format used by Language Corpus Markup (LCM).

Dictionary resources are separate from LCM documents.

LCM documents reference dictionary resources through dictionary annotations.

Example:

```txt
@"供品"

  @dictionary:
    ref: dict:zh:gongpin#sense-1
```

Dictionary resources may contain:

* lexical entries
* meanings
* forms
* morphology
* decomposition knowledge
* syntax patterns

Dictionary resources provide linguistic knowledge.

LCM documents provide corpus instances.

---

# 2. Design Philosophy

Dictionary resources are designed to support:

* language learning
* corpus annotation
* automatic lookup
* automatic decomposition
* dictionary creation
* linguistic analysis

The model separates:

```txt
Dictionary Knowledge
↓
Dictionary JSON

Corpus Data
↓
LCM Document

Viewer Configuration
↓
Display Configuration
```

Dictionary entries MUST NOT contain viewer-specific information.

Dictionary entries MUST NOT contain speaker colors, popup layout, annotation ordering, or other presentation settings.

---

# 3. Relationship to LCM

Dictionary resources are external.

LCM targets reference dictionary information using:

```txt
@dictionary
```

Dictionary information MAY be provided:

1. by explicit dictionary reference
2. by inline dictionary fields
3. by automatic dictionary scan

Meaning resolution priority:

```txt
1. Explicit dictionary fields

2. Dictionary reference

3. Automatic dictionary scan
```

This matches the LCM specification.

---

# 4. Dictionary Object

```ts
type Dictionary = {
  id: Id;
  title: string;
  language: LanguageId;
  version?: string;
  description?: string;
  license?: LicenseInfo;
  source?: SourceInfo;
  entries: DictionaryEntry[];
};
```

A Dictionary represents a collection of lexical entries.

Examples:

* Okinawan dictionary
* CC-CEDICT
* custom lesson dictionary

---

# 5. Dictionary Entry

```ts
type DictionaryEntry = {
  id: Id;

  lemma: DictionaryForm;

  forms: DictionaryForm[];

  pos?: PartOfSpeech[];

  senses: Sense[];

  morphology?: Morphology;

  syntaxPatterns?: SyntaxPattern[];

  notes?: string[];
  tags?: string[];

  source?: SourceInfo;
};
```

An entry represents a lexical item.

Examples:

* 雨
* 降ゆん
* 供品

---

# 6. Stable References

Dictionary entries SHOULD be referenceable.

Recommended URI format:

```txt
dict:<dictionary-id>:<entry-id>
```

Examples:

```txt
dict:uch:furu
dict:zh:gongpin
```

Senses SHOULD also be referenceable.

Recommended format:

```txt
dict:<dictionary-id>:<entry-id>#<sense-id>
```

Examples:

```txt
dict:uch:furu#sense-1
dict:zh:gongpin#sense-1
```

---

# 7. Forms

Forms represent alternative realizations of the same lexical item.

```ts
type DictionaryForm = {
  text: string;
  formType?: FormTypeId;
  role: FormRole;
  source?: FormSource;
  variety?: string;
};
```

Examples of form types:

```txt
kana
pinyin
zhuyin
phoneme
ipa
romanization
```

Examples of roles:

```txt
lemma
variant
searchKey
surface
inflected
stem
affix
```

Example:

```json
{
  "text": "ふとーん",
  "formType": "kana",
  "role": "inflected"
}
```

---

# 8. Meanings and Senses

A lexical entry may have multiple senses.

```ts
type Sense = {
  id: Id;

  meanings: Meaning[];

  definitions?: Definition[];

  examples?: Example[];

  notes?: string[];

  tags?: string[];

  relations?: SenseRelation[];

  morphologyNotes?: string[];
};
```

Meanings are intended for popup display.

Definitions are intended for detailed explanation.

Example:

```json
{
  "id": "sense-1",
  "meanings": [
    {
      "lang": "ja",
      "text": "供え物"
    }
  ]
}
```

---

# 9. Morphology

Morphology describes inflectional and derivational information.

```ts
type Morphology = {
  type: "verb" | "noun" | "adjective" | "particle" | "affix" | "other";

  conjugationClass?: string;

  stems?: Record<string, DictionaryForm>;

  forms?: InflectedForm[];

  decompositionPatterns?: DecompositionPattern[];

  notes?: string[];
};
```

Examples:

* Okinawan verb conjugations
* Chinese resultative constructions
* grammatical particles

---

# 10. Inflected Forms

Inflected forms are searchable surface realizations.

```ts
type InflectedForm = {
  form: DictionaryForm;

  label?: string;

  features?: MorphologicalFeature[];

  decomposition?: DecompositionPattern;
};
```

Example:

```json
{
  "label": "tooN-form",

  "form": {
    "text": "ふとーん",
    "role": "inflected"
  },

  "features": [
    "ASPECT:PROGRESSIVE"
  ]
}
```

Inflected forms SHOULD be searchable by automatic dictionary scan.

---

# 11. Decomposition Patterns

A decomposition pattern represents structural knowledge.

```ts
type DecompositionPattern = {
  components: DecompositionComponent[];
};
```

Example:

```txt
hutooN
↓
hut + ooN
```

Example:

```json
{
  "components": [
    {
      "ref": "dict:uch:furu"
    },
    {
      "role": "aspectMarker"
    }
  ]
}
```

Decomposition patterns are used to propose:

```txt
@decompose
```

during automatic analysis.

---

# 12. Automatic Dictionary Scan

Dictionary resources support automatic lookup.

Viewer implementations MAY perform dictionary scans.

The preferred implementation is:

```txt
surface text
↓
dictionary lookup
↓
entry match
↓
sense candidate
```

Examples:

```txt
供品
↓
dict:zh:gongpin
```

```txt
ふとーん
↓
dict:uch:furu
```

---

# 13. Automatic Decomposition

Automatic decomposition extends automatic dictionary scan.

Process:

```txt
surface text
↓
dictionary lookup
↓
morphology match
↓
decomposition pattern
↓
proposed @decompose
```

Example:

```txt
降とーん
↓
降 + とーん
```

The generated decomposition is only a proposal.

Human review is recommended.

---

# 14. Syntax Patterns

Dictionary resources MAY contain syntax patterns.

```ts
type SyntaxPattern = {
  label: string;
  pattern: string;
};
```

Examples:

```txt
Verb + ooN
```

```txt
Resultative Construction
```

Syntax patterns provide reusable grammatical knowledge.

Future versions MAY use syntax patterns for automatic grammar annotation.

---

# 15. Lesson Dictionary Generation

A lesson dictionary is a subset of a larger dictionary.

Pipeline:

```txt
Global Dictionary
↓
LCM Document
↓
Vocabulary Extraction
↓
Lesson Dictionary
```

A lesson dictionary SHOULD contain only entries required by a specific document.

Benefits:

* smaller downloads
* faster lookup
* offline use
* mobile-friendly viewing

---

# 16. Search Index

Implementations MAY generate dedicated search indexes.

Example:

```txt
lemma
variant
searchKey
inflected form
generated surface form
```

The search index is an implementation detail.

It is not part of the canonical dictionary model.

---

# 17. Suggested Okinawan Dictionary Mapping

Current structure:

```txt
id
index
phonetics
pos
conjugation
meaning
remarks
```

Recommended mapping:

```txt
id
↓
entry.id

index[0]
↓
lemma

index[]
↓
forms(searchKey)

phonetics
↓
forms(formType)

pos
↓
pos

conjugation
↓
morphology

meaning
↓
senses

remarks
↓
notes
```

Original data SHOULD be preserved.

Transformation into LCM Dictionary JSON SHOULD be performed by adapter scripts.

---

# 18. Future Extensions

Potential future additions:

* Wiktionary adapter
* CEDICT adapter
* FLEx import/export
* LIFT import/export
* OntoLex export
* grammar pattern libraries
* automatic sense disambiguation
* morphology analyzers
* dictionary editor integration
* syntax-driven auto annotation

---

# 19. Open Questions

1. Stable URI conventions
2. Dialect representation
3. Register representation
4. Pronunciation variety representation
5. Morphological feature vocabulary
6. Syntax pattern representation
7. Auto decomposition confidence model
8. Sense disambiguation workflow
9. Lesson dictionary generation strategy
10. JSON Schema definition
