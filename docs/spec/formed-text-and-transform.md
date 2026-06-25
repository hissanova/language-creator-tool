# FormedText and Transform Markup

Status: Draft

In LCM, a text expression is not only a string. It is understood as:

1. what is written
2. what language it belongs to
3. what form or representation it uses

Parser output maps this idea to Core JSON as `FormedText`:

```ts
type FormedText = {
  text: string;
  languageId: string;
  formId: string;
};
```

Examples:

```text
text: hello
languageId: en
formId: latin
```

```text
text: こんにちは
languageId: ja
formId: kana
```

```text
text: hoge
languageId: ja
formId: romaji
```

`languageId` identifies the language. `formId` identifies how the text is
written or represented, such as `latin`, `kana`, `romaji`, or `phoneme`.

## Transform Syntax

A transform creates a new formed-text output from the current selected
`TextNode`.

Conceptually:

```text
FormedText = text + languageId + formId
Transform = FormedText -> FormedText
```

Core syntax:

```lcm
-> <transformType> [lang:<languageId>] [form:<formId>]:
  <outputText>
```

Example:

```lcm
@"日本人"
  -> translation lang:en:
    Japanese person
```

This maps the selected text to an English translation.

## Anonymous Transform Syntax

LCM also supports anonymous transform syntax when the intended transform type
can be inferred from the arguments:

```lcm
-> lang:<languageId>
```

```lcm
-> lang:<languageId>
  <outputText>
```

```lcm
-> form:<formId>
  <outputText>
```

Examples:

```lcm
@"hello"
  -> lang:en
```

Meaning: the same text is interpreted as English.

```lcm
@"こんにちは"
  -> lang:en
    hello
```

Meaning: translate to English.

```lcm
@"ほげ"
  -> form:romaji
    hoge
```

Meaning: same language, different form.

## Transform EBNF

This EBNF is parser-oriented and defines named and anonymous transform
statements.

```ebnf
TransformStatement
  = "->" , S , (
      NamedTransform
      | AnonymousTransform
    ) ;

NamedTransform
  = TransformType ,
    { S , TransformArgument } ,
    ":" ,
    [ NL , IndentedText ] ;

AnonymousTransform
  = TransformArgument ,
    { S , TransformArgument } ,
    [ NL , IndentedText ] ;

TransformArgument
  = LangArgument
  | FormArgument ;

LangArgument
  = "lang:" , Identifier ;

FormArgument
  = "form:" , Identifier ;

TransformType
  = Identifier ;

Identifier
  = IdentifierStart , { IdentifierChar } ;

IdentifierStart
  = ALPHA | "_" ;

IdentifierChar
  = ALPHA | DIGIT | "_" | "-" ;

IndentedText
  = TextLine , { NL , TextLine } ;
```

Notes:

* Anonymous transforms must contain at least one argument.
* Anonymous transforms cannot consist solely of output text.
* A trailing `:` is required for named transforms.
* Output text is optional only for transform types that permit metadata-only
  changes, for example `language` or `form`.

## Preset Transform Types

LCM reserves common transform types so tools and viewers can treat them
consistently.

| Transform type | Expected arguments |
| --- | --- |
| `translation` | Usually requires `lang`; output text required. |
| `correction` | Output text required; `lang` and `form` optional. |
| `form` | Usually requires `form`; output text optional only if changing `formId` only. |
| `language` | Requires `lang`; output text optional. |
| `lemma` | Output text required; `lang` and `form` optional. |
| `romanization` | Usually requires `form:romaji`; output text required. |
| `transliteration` | Requires `form` or `lang` and `form`; output text required. |
| `phonemization` | Usually requires `form:phoneme`; output text required. |
| `representation` | Output text required; `lang` and `form` optional. |

Example:

```lcm
@"went"
  -> lemma:
    go
```

Meaning: maps an inflected or surface form to its lemma.

Other examples:

```lcm
@"法國人"
  -> correction:
    法文
```

Meaning: explicit correction.

```lcm
@"日本人"
  -> translation lang:en:
    Japanese person
```

Meaning: explicit translation.

## Anonymous Transform Inference

Anonymous transforms infer the transform type from their arguments and output.

```lcm
-> lang:en
```

is inferred as:

```text
transformType: language
```

```lcm
-> lang:en
  hello
```

is inferred as:

```text
transformType: translation
```

```lcm
-> form:romaji
  hoge
```

is inferred as:

```text
transformType: form
```

Rules:

* Anonymous `->` must contain at least one argument.
* Anonymous `->` with only text and no `lang` or `form` is invalid.
* Use explicit `-> correction:` for correction.
* Use explicit `-> lemma:` for lemma derivation.
* Use an explicit transform type when the intent is not inferable.

Invalid:

```lcm
@"法國人"
  ->
    法文
```

Valid:

```lcm
@"法國人"
  -> correction:
    法文
```

## Legacy Language Syntax

Old `+language` is legacy sugar only.

```lcm
@"hello"
  +language:
    en
```

is equivalent to:

```lcm
@"hello"
  -> lang:en
```

Do not recommend `+language` in new tutorials.
