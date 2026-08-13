#!/usr/bin/env node

/////
// import deps
/////
const chalk = require('chalk')
const columns = require('cli-columns')
const tabtab = require('tabtab')
/// import local files
const flags = require('unified-pride-flags')
const { name: programName, version } = require('../package.json')
const { randNum, interpolateColor, FlagColors, ArgParser } = require('./util')

const cliOptions = {
    help: { type: 'boolean', short: '?', description: 'Display this help text' },
    version: {type: 'boolean', description: 'Print installed version'},
    gradient: {
        type: 'boolean',
        short: 'g',
        description: 'Make the flag a smooth gradient',
    },
    vertical: {
        type: 'boolean',
        short: 'v',
        description: 'Display the flag, but vertically',
    },
    live: {
        type: 'boolean',
        short: 'l',
        description: 'Hold the terminal and redraw the flag upon resize, closing when any key is pressed',
    },
    blend: {
        type: 'string',
        short: 'b',
        description: 'Blend two flags together, with an optional decimal factor',
        argName: 'flag[,factor]',
    },
    character: {
        type: 'string',
        short: 'c',
        description: 'Character to use to draw the flag',
        argName: 'char',
    },
    newline: {
        type: 'boolean',
        short: 'n',
        description: 'Prints a newline at the end of each line',
    },
    random: {
        type: 'boolean',
        short: 'r',
        description: 'Displays a random flag! This ignores any passed flags.',
    },
    printname: {
        type: 'boolean',
        short: 'p',
        description: 'Prints name of the randomly chosen flag before the flag. Only works with --random',
    },
    height: {
        type: 'string',
        short: 'h',
        description: 'The height of the flag, in characters',
        argName: 'int',
    },
    width: {
        type: 'string',
        short: 'w',
        description: 'The width of the flag, in characters',
        argName: 'int',
    },
    'use-flag-height': {
        type: 'boolean',
        description: 'Uses the number of stripes the flag has as its height. Overrides --height',
    },
    'use-flag-width': {
        type: 'boolean',
        description: 'Uses the number of stripes the flag has as its width. Overrides --width',
    },
    'install-completion': {
        type: 'boolean',
        description: 'Install tabtab shell completion',
    },
}
/////
// setup
/////

const argparser = new ArgParser(cliOptions)

const { args, options } = argparser.parse()
const CHAR = options.character?.trim().substring(0, 1) || '█'
const CHOSEN_FLAG = args[0]?.trim().toLowerCase()

function help() {
    let flagList = []
    const flagEntries = Object.entries(flags)
    /// im not hardcoding this anymore
    /// grab the flag names, sort by length (descending), grab the longest,
    /// and add 2 to its length to offset the flags
    const MINI_FLAG_DISTANCE = flagEntries.map((v) => v[0]).sort((a, b) => b.length - a.length)[0].length + 2

    for (const [name, flag] of flagEntries) {
        /// we want all the mini-flags to be at the same starting distance from the left,
        /// so figure out how many spaces we need to add after the flags name
        const spaces = MINI_FLAG_DISTANCE - name.length
        let flagLine = name.padEnd(name.length + spaces, ' ') /// add calculated spaces...
        flagLine += flag.stripes.map((color) => chalk.hex(color)(CHAR)).join('') /// ..and then add the miniflag
        flagList.push(flagLine)
    }

    console.log(`Usage:\n  ${chalk.green(programName)} ${chalk.blueBright('[options...]')} ${chalk.yellow('[flag]')}\n`)
    console.log(`Options:\n${argparser.listOptions()}\n`)
    console.log(`Flags:\n${chalk.green(columns(flagList, { padding: 1 }))}`)
}

function completion(env = {}) {
    if (!env?.complete) {
        return
    }
    const args = env.partial.split(' ').slice(1).filter(Boolean)
    const activeOptions = args
        .filter((v) => v.startsWith('-'))
        /// splitting grouped args, like `-gb` into `-g -b`
        .flatMap((v) => {
            if (v.startsWith('--')) {
                return v
            }
            /// skipping the furst `-`, grab the remaining `gb` and split into `['-g', '-b']`
            /// this doesnt work for options with args, like `-h3`,
            /// but that doesnt matter for us; we only care about the ones we know of
            return v
                .slice(1)
                .split('')
                .map((v) => `-${v}`)
        })

    /// long option completion
    if (env.last.startsWith('--')) {
        /// filter out options already in use
        const availableOptions = Object.entries(cliOptions)
            .map((v) => {
                const [name, body] = v

                let completionObj = {
                    name: `--${name}`,
                    description: body.description,
                    short: `-${body.short}`,
                }

                return completionObj
            })
            .filter((v) => !activeOptions.includes(v.name) && !activeOptions.includes(v.short))

        return tabtab.log(availableOptions)
    }

    /// short option completion
    if (env.last.startsWith('-')) {
        const availableOptions = Object.entries(cliOptions)
            .map((v) => {
                const [name, body] = v
                /// ignore if theres no short name set
                if (!body.short) {
                    return {}
                }

                const completionObj = {
                    name: `-${body.short}`,
                    description: body.description,
                    long: `--${name}`,
                }

                return completionObj
            })
            .filter((v) => v.name && !activeOptions.includes(v.name) && !activeOptions.includes(v.long))

        return tabtab.log(availableOptions)
    }

    return tabtab.log(Object.keys(flags))
}

function createFlag(availableWidth, availableHeight, options) {
    const colors = new FlagColors(flag)
    let blendColors = null
    let blendFactor = 0
    let finishedFlag = ''
    let position = 0 /// position in flag
    let currLine = 0 /// position in term
    let mode = options.gradient ? 'gradient' : null

    if (options.blend) {
        let [blendFlag, factor] = options.blend.split(',')
        blendFlag = blendFlag.toLowerCase()

        if (!flags[blendFlag]) {
            throw new Error(`The flag "${blendFlag}" doesn't exist!`)
        }

        blendFactor = parseFloat(factor)
        if (isNaN(blendFactor)) {
            blendFactor = 0.5
        }

        blendColors = new FlagColors(flags[blendFlag])
    }

    if (options.vertical) {
        /// building a single row :3
        while (position < 1) {
            currLine++
            position = (currLine / availableWidth).toFixed(3)
            let color = colors.getColor(position, mode)

            if (blendColors) {
                const color2 = blendColors.getColor(position, mode)
                color = interpolateColor(color, color2, blendFactor)
            }
            finishedFlag += chalk.hex(color)(CHAR)
        }
        if (options.width || options['use-flag-width'] || options.newline) {
            finishedFlag += '\n'
        }
        return finishedFlag.repeat(availableHeight).trim()
    }

    /// clearly its not a vertical flag, proceed with horizontal
    while (position < 1) {
        currLine++
        position = (currLine / availableHeight).toFixed(3)
        let color = colors.getColor(position, mode)

        if (blendColors) {
            const color2 = blendColors.getColor(position, mode)
            color = interpolateColor(color, color2, blendFactor)
        }
        finishedFlag +=
            chalk.hex(color)(CHAR.repeat(availableWidth)) +
            (options.width || options['use-flag-width'] || options.newline ? '\n' : '')
    }
    return finishedFlag.trim()
}

function draw() {
    if (options.live) {
        // Go to (0,0), clear screen, and hide cursor
        process.stdout.write('\x1b[0;0f\x1b[2J\x1b[?25l')
    }
    try {
        // if --use-flag-height: if flag has weights, use the sum of those, otherwise its number of stripes, else if --height, use that, else use terminal height
        const availableHeight = options['use-flag-height']
            ? flag.weights?.reduce((a, b) => a + b, 0) ?? flag.stripes.length
            : options.height ?? process.stdout.rows
        // same thing but with width
        const availableWidth = options['use-flag-width']
            ? flag.weights?.reduce((a, b) => a + b, 0) ?? flag.stripes.length
            : options.width ?? process.stdout.columns

        if (availableWidth <= 0 || availableHeight <= 0) {
            throw new Error('Width and height must be greater than 0')
        }
        const builtFlag = createFlag(availableWidth, availableHeight, options)
        process.stdout.write(builtFlag)
    } catch (err) {
        console.log(err)
        if (options.live) {
            process.stdout.write('\x1b[?25h')
            process.exit(1)
        }
    }
    if (!options.live) {
        process.stdout.write('\n')
    }
}

/////
// run
/////

///// completion
/// install completion
if (options['install-completion']) {
    tabtab
        .install({
            name: programName,
            completer: programName,
        })
        .then(() => {
            process.exit(0)
        })
        .catch((err) => {
            console.log('Completion install error: ', err)
            process.exit(1)
        })
    return
}
/// jank to allow for tabtab
if (CHOSEN_FLAG === 'completion') {
    const env = tabtab.parseEnv(process.env)
    return completion(env)
}

///// tool
// Check terminal environment
if (!chalk.supportsColor) {
    console.log("Your terminal doesn't support color!")
    process.exit(1)
}
chalk.level = 3 // try to use truecolor

if (options.version) {
    console.log(`${chalk.green(`${programName}`)} v${chalk.blueBright(`${version}`)}`)
    process.exit()
}

if (options.help || (!options.random && !Object.keys(flags).includes(CHOSEN_FLAG))) {
    /// this is less cursed lol
    help()
    process.exit()
}

let flag = flags[CHOSEN_FLAG]
if (options.random) {
    const flagKeys = Object.keys(flags)
    flagName = flagKeys[randNum(flagKeys.length - 1)]
    flag = flags[flagName]
    if (options.printname) {
        process.stdout.write(flagName + '\n')
    }
}

if (options.live) {
    // Ensure any keypress will close program
    process.stdin.setRawMode(true)
    // Make sure process doesn't exit when finished
    process.stdout.once('data', () => {
        process.stdout.write('\x1b[2J\x1b[1;1H') // clear screen
        process.stdout.write('\x1b[?25h') // Show cursor
        // MAYBE: clear scrollback with [3J?
        process.exit()
    })
    // Redraw if dimensions change
    process.stdout.on('resize', () => {
        draw()
    })
}

// woo, build the flag!
draw()
