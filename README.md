# face-mask

## 開発環境準備

```
# cloneしてローカルに持ってくる
$ git clone https://github.com/shota8888/face-mask.git
$ cd face-mask
```

## 運用フロー

```
# 1. githubのコードに変更があった場合、ローカルのブランチを最新状態にする
$ git pull origin main

# 2. ブランチを切る（今回はデザイン作業を想定）
# mainブランチに移動
$ git checkout main
# mainブランチからブランチを切って移動（ブランチ名は作業する名前）
$ git checkout -b design

# 3. githubにコードを渡す
$ git add .
$ git commit -m "作業した内容などのコメント"
$ git push origin design
```
