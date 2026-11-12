# Download and play

[Download Rift Ledger ZIP](https://github.com/Peerapol147/rift-ledger/raw/refs/heads/claude/responsive-ui/downloads/rift-ledger-play.zip)

แตก ZIP แล้วเปิด `rift-ledger/play.html` ด้วยเบราว์เซอร์ กด **เปิดเพลง** ภายในเกม.
ภาพและเพลงรวมอยู่ในไฟล์แล้ว.

GitHub serves raw HTML as text/plain, so the HTML link is not a reliable download button.
The ZIP contains the same built HTML plus Thai opening instructions.

For maintainers: after `npm run build`, run `python tools/package-download.py` and commit
both `play.html` and the refreshed ZIP. Do not distribute an older ZIP after updating the game.
