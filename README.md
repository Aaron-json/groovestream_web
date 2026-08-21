# GrooveStream Frontend

The web client and its shared packages live in one npm workspace. Shared
packages contain the API contract and platform-neutral media/query behavior;
rendering and playback remain application-owned.

GrooveStream is a web application that allows users to organize and share their music with friends and family. In simpler use cases, it allows a user to access their local music across multiple devices.

## Development

- `npm run dev` starts the Vite application.
- `npm run build` creates a production build.
- `npm run gen-api` regenerates the shared API client from the backend.
- `npm run check` and `npm run lint` validate every workspace.

The root override replaces the vulnerable `js-yaml@4.2.0` pinned by Hey API's
schema parser and can be removed when the parser updates.

The web application is deployed at [GrooveStream](https://groovestream.app/).

## License
[GPLv3](https://choosealicense.com/licenses/gpl-3.0/)

## Issues
For issues or bugs, please open an issue on this repository and I will try to respond as soon as possible.
