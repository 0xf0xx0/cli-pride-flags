# cli-pride-flags

Displays pride flags in your terminal~

# Install
## NPM
```sh
npm i -g cli-pride-flags
```

## AUR
There's also a package in the AUR, maintained by `u/rhysperry111`! Install it with your favorite AUR helper: `cli-pride-flags`

## From cloned repo
```sh
npm i
npm link --global
```

# Usage
```
Usage:
  cli-pride-flags [options...] [flag]

Options:
  -b, --blend flag[,factor] Blend two flags together, with an optional decimal factor
  -c, --character char      Character to use to draw the flag
  -g, --gradient            Make the flag a smooth gradient
  -h, --height int          The height of the flag, in characters
  -?, --help                Display this help text
      --install-completion  Install tabtab shell completion
  -l, --live                Hold the terminal and redraw the flag upon resize, closing when any key is pressed
  -n, --newline             Prints a newline at the end of each line
  -p, --printname           Prints name of the randomly chosen flag before the flag. Only works with --random
  -r, --random              Displays a random flag! This ignores any passed flags.
      --use-flag-height     Uses the number of stripes the flag has as its height. Overrides --height
      --use-flag-width      Uses the number of stripes the flag has as its width. Overrides --width
      --version             Print installed version
  -v, --vertical            Display the flag, but vertically
  -w, --width int           The width of the flag, in characters
```
Example: `cli-pride-flags -l trans` would display the trans flag and hold the terminal.

# Screenshots
Theres a page previewing all the flags on [my site :3](https://0xf0xx0.eth.limo/flags.html)

Some screenshots are below!

![agen, bi, fluid](./screenies/1.png)

![bunch of flags and help text :D](./screenies/2.png)

# Issues
- none :3

# TODO
- commit more crimes, but queerly
- conquer the world with the queer agenda
