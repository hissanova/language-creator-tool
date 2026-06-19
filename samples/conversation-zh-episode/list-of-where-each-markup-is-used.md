#################
use this list to find the markup examples in the .lcm / audio.mp3
#################


# +tag unnatural
11
00:00:27,927 --> 00:00:30,030
>simon: 聽我?你看得到嗎? 
 @"聽我" 
 +tag unnatural



# +bold
12
00:00:30,597 --> 00:00:31,765
>lan: 問你。
@"問"
 +bold



# @line:
15
00:00:36,569 --> 00:00:38,004
>simon: 日本人の皆さん！ 
 @line 
 +translation zh 
 大家日本人 
 +translation en 
 Japanese people!


# +italic 
17
00:00:42,108 --> 00:00:42,709
> :「問」
 @"問"
 +italic



# @note
20
00:01:43,169 --> 00:01:45,905
>:[音楽を聞く」のは「聽」。 
...
 +note
  in Japanese both "ask" and "listen" use the same word, pronounced "kiku"



# @resource:
218
00:00:43,410 --> 00:00:46,146
>:[音楽を聞く」のは「聽」。 
 @"「音楽を聞く」のは" 
  +translation zh 
   聽音樂是
  +translation en
   listen to music is
  +note
   in Japanese both "ask" and "listen" use the same word, pronounced "kiku"
  +resource url:
   href: https://www.guidetojapanese.org/blog/2006/05/08/distinguishing-between-same-kanji/


# Speaker inheritance:
15
00:00:36,569 --> 00:00:38,004
>simon: 日本人の皆さん！ 
 @line 
 +translation zh 
 大家日本人 
 +translation en 
 Japanese people!

16
00:00:38,338 --> 00:00:41,741
>: 「質問の聞く」のは「問」。 
 @"質問の「聞く」のは" 
 +translation zh 
 聽一個問題是

17
00:00:42,108 --> 00:00:42,709
> :「問」
 @"問"
 +italic

18
00:00:43,410 --> 00:00:46,146
>:[音楽を聞く」のは「聽」。 
 @"「音楽を聞く」のは" 
  +translation zh 
   聽音樂是
  +translation en
   listen to music is
  +note
   in Japanese both "ask" and "listen" use the same word, pronounced "kiku"
  +resource url:
   href: https://www.guidetojapanese.org/blog/2006/05/08/distinguishing-between-same-kanji/

19
00:00:46,679 --> 00:00:48,248
>lan: 沒錯。


# +language
20
00:00:48,648 --> 00:00:49,349
>simon: はっ！
 @line
  +language:
   ja


# +reference:
28
00:01:06,699 --> 00:01:13,440
>simon: 我戴這個新的眼...睛?
 @line
  +resource image:
   src: images/newglasses.png



# underline
29
00:01:14,107 --> 00:01:15,208
>lan: 眼睛
 @line
  +underline



# @decomposition
49
00:02:07,026 --> 00:02:09,028
>lan: 眼睛變差了
 @line
  @decompose
   眼睛|變|差|了
  @"眼睛"
   +translation en
    eyes
  @"變"
   +translation en
    become
  @"差"
   +translation en
    different, bad
  @"了"
   +dictionary
     marker of completion



# @sound:
60
00:02:26,446 --> 00:02:27,380
>sound: typing
 @line
  +sound:
   keyboard typing



# timing in the target
64
00:02:34,087 --> 00:02:35,221
>simon: 老人 
 @"老人" [00:03:34,070 --> 00:03:34,280]
  +translation zh 
   老人 
  +translation en 
   elderly people


# +correction
136
00:05:38,371 --> 00:05:53,386
>simon: 然後,我回答的時候,我跟我老師說,我說了,明天一起,我們一起去...「メガネ屋さん」是怎麼說? 
 @"老師" 
  +correction 
   老婆 
 @"メガネ屋さん" 
  +translation zh 
   眼鏡行 
  +translation en 
   optician



# aim at one particular instance of a target
80
00:03:07,654 --> 00:03:09,656
>simon: 花是「花]の花？
 @"花"[2]
  +translation en
    flower



















































###############################################
MODEL: 
15
00:01:36,329 --> 00:01:37,764
>simon: 日本人の皆さん！ 
@"日本人の皆さん" 
 +translation zh 
  大家日本人 
 +translation en 
  Japanese people
 +translation ja
  日本人の皆さん

###############################################


include all these:

















when a target appears twice in a line but needs to be different targets (because e.g.the instances have different pronunciations):
>: 寒いから寒いと言った
  @"寒い"[2]













