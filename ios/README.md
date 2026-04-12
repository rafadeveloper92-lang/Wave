# Wave — iOS (Capacitor)

## Requisitos

- macOS com **Xcode** (recomendado: última versão estável).
- Node 22+ (igual ao resto do repo).

## Desenvolvimento

```bash
npm ci
npm run build
npx cap sync ios
```

Abre **`App/App.xcodeproj`** no Xcode, escolhe um **simulador** ou o teu **iPhone** (com conta Apple / equipa de desenvolvimento) e carrega em **Run**.

## Permissões

`Info.plist` inclui textos para microfone, câmara e localização (chat e chamadas).

## CI

O workflow **Build iOS (simulator)** no GitHub Actions gera um artefacto **ZIP** com a `.app` para simulador — **não** substitui instalação na App Store nem IPA para dispositivo real (isso exige certificados Apple no teu Mac ou pipeline com segredos).
