# anisav-mobile

anilibria не на ios, так что сделал сам. expo + react native.

каталог, поиск, расписание, плеер с автопропуском опенинга/эндинга, локальный вишлист без аккаунта, вход в аккаунт если надо синк списков.

бекенд тут не при чем, дергает `api.savsis.xyz`.

## запуск

```
npm install
npx expo start
```

## билды

- ios: `.github/workflows/ios-unsigned.yml`, unsigned ipa, гоняй через AltStore/SideStore
- android: `.github/workflows/android-release.yml`, release apk (подписан дебаг-ключом, для сайдлоада ок), просто ставь и запускай

обе кнопкой в Actions или смотри в [Releases](https://github.com/ImSavsis/anisav-mobile/releases)

сделано im.savsis.xyz
