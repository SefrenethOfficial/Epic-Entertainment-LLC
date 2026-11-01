# Epic Entertainment LLC

Games hub for Epic Entertainment: Google sign-in, HTML games, points, favorites and a leaderboard.

- **Live site:** https://sefrenethofficial.github.io/Epic-Entertainment-LLC/
- **Hosting:** GitHub Pages (static files, no build step). Pushing to `main` republishes the `gh-pages` branch.
- **Backend:** Firebase Authentication (Google) + Cloud Firestore.

## Files

| File | What it does |
| --- | --- |
| `index.html`, `styles.css`, `app.js` | The site |
| `backend.js` | All Firebase reads/writes |
| `firebase-config.js` | Your Firebase web config (public by design) |
| `firestore.rules` | Security rules: paste into Firestore → Rules |

## Admin

Signing in as **epocendie@gmail.com** shows **＋ Add game** plus edit/delete buttons on each game.
Games can be an uploaded `.html` file, pasted HTML, or a link to a game hosted elsewhere.
The rules in `firestore.rules` make sure nobody else can change games, even by calling Firebase directly.

## Points

Players get 10 points each time they start a game, at most once a minute (enforced by the rules).

## Notes

- HTML games run in a sandboxed frame so they can't touch players' logins. Inside that frame
  `localStorage` is replaced with an in-memory version, so in-game saves last until the game is closed.
- Very large HTML files are split into ~250 KB pieces automatically (Firestore's 1 MB document limit).
