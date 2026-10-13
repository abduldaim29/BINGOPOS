# App Versioning

App version follows SemVer with a `v` prefix, for example `v2.10.5`.

## Version Source

- Git tag is the release identity of the repository.
- `APP_VERSION` is the runtime value shared to the frontend.
- `config/app.php` provides a fallback when the environment has not set the value.
- Version is displayed in the dashboard sidebar and POS navbar.

## Release Checklist

1. Determine the next SemVer version.
2. Update `APP_VERSION` in `.env.example` and deployment environment.
3. Update `CHANGELOG.md` and public roadmap page.
4. Run tests and production build.
5. Create an annotated Git tag with the same value.
6. Ensure `APP_VERSION` matches the latest Git tag.

Current release: `v2.10.5`.
