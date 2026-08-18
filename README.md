# GrooveStream Frontend

The web and mobile clients live in one npm workspace. Shared packages contain
the API contract and platform-neutral media/query behavior; rendering and
playback engines remain application-owned.

GrooveStream is a web application that allows users to organize and share their music with friends and family. In simpler use cases, it allows a user to access their local music across multiple devices.

## Development

- `npm run dev:web` starts the Vite application.
- `npm run dev:mobile` starts Metro for an installed development build.
- `npm run dev:mobile:ios` builds and opens the app in the iOS Simulator.
- `npm run dev:mobile:ios:device` builds and installs the app on a connected iPhone.
- `npm run dev:mobile:android` builds and opens the app in an Android emulator.
- `npm run dev:mobile:android:device` builds and installs the app on a connected Android device.
- `npm run gen-api` regenerates the shared API client from the backend.
- `npm run check` and `npm run lint` validate every workspace.

The root override replaces the vulnerable `js-yaml@4.2.0` pinned by Hey API's
schema parser and can be removed when the parser updates.

## Mobile setup

Copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in the Supabase
values. In Supabase, open **Authentication → URL Configuration** and add
`groovestream://auth/callback` to **Redirect URLs**. The Site URL remains the
web application URL. Google should still redirect to Supabase's OAuth callback,
not directly to the app scheme.

Mobile development uses Metro on port 8082 because the backend owns 8081. Use
the platform-specific `dev:mobile:*` command above to create a native
development build. After it is installed, `npm run dev:mobile` is enough for
ordinary JavaScript and TypeScript changes. Changes to native dependencies,
the app scheme, or background-audio settings require a new native build.

Mobile presentation stays inside `apps/mobile`. Semantic theme roles live in
`global.css`; reusable interactive components live in `src/components/ui` and
use Gluestack; screen layout and FlashList rows use React Native primitives with
Uniwind. Shared packages do not export UI.

The web application is deployed at [GrooveStream](https://groovestream.app/).

## License
[GPLv3](https://choosealicense.com/licenses/gpl-3.0/)

## Issues
For issues or bugs, please open an issue on this repository and I will try to respond as soon as possible.
