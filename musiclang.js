"use strict";

/*
 * // The music language made for making simple tunes. The following is an example...
 * 
 * set UNITS_PER_SECOND 1 // One unit is one second...
 * 
 * track Guitar {
 *     play A4 1
 *     rest 0.1
 *     play C4 2
 *     repeat 10 {
 *         play A3 0.1
 *         play G5 0.1
 *     }
 * }
 */

const NOTE_TO_MIDI = {
    'G9': 127,
    'F#9': 126,
    'F9': 125,
    'E9': 124,
    'D#9': 123,
    'D9': 122,
    'C#9': 121,
    'C9': 120,
    'B8': 119,
    'A#8': 118,
    'A8': 117,
    'G#8': 116,
    'G8': 115,
    'F#8': 114,
    'F8': 113,
    'E8': 112,
    'D#8': 111,
    'D8': 110,
    'C#8': 109,
    'C8': 108,
    'B7': 107,
    'A#7': 106,
    'A7': 105,
    'G#7': 104,
    'G7': 103,
    'F#7': 102,
    'F7': 101,
    'E7': 100,
    'D#7': 99,
    'D7': 98,
    'C#7': 97,
    'C7': 96,
    'B6': 95,
    'A#6': 94,
    'A6': 93,
    'G#6': 92,
    'G6': 91,
    'F#6': 90,
    'F6': 89,
    'E6': 88,
    'D#6': 87,
    'D6': 86,
    'C#6': 85,
    'C6': 84,
    'B5': 83,
    'A#5': 82,
    'A5': 81,
    'G#5': 80,
    'G5': 79,
    'F#5': 78,
    'F5': 77,
    'E5': 76,
    'D#5': 75,
    'D5': 74,
    'C#5': 73,
    'C5': 72,
    'B4': 71,
    'A#4': 70,
    'A4': 69,
    'G#4': 68,
    'G4': 67,
    'F#4': 66,
    'F4': 65,
    'E4': 64,
    'D#4': 63,
    'D4': 62,
    'C#4': 61,
    'C4': 60,
    'B3': 59,
    'A#3': 58,
    'A3': 57,
    'G#3': 56,
    'G3': 55,
    'F#3': 54,
    'F3': 53,
    'E3': 52,
    'D#3': 51,
    'D3': 50,
    'C#3': 49,
    'C3': 48,
    'B2': 47,
    'A#2': 46,
    'A2': 45,
    'G#2': 44,
    'G2': 43,
    'F#2': 42,
    'F2': 41,
    'E2': 40,
    'D#2': 39,
    'D2': 38,
    'C#2': 37,
    'C2': 36,
    'B1': 35,
    'A#1': 34,
    'A1': 33,
    'G#1': 32,
    'G1': 31,
    'F#1': 30,
    'F1': 29,
    'E1': 28,
    'D#1': 27,
    'D1': 26,
    'C#1': 25,
    'C1': 24,
    'B0': 23,
    'A#0': 22,
    'A0': 21
};

const GUITAR_TO_NOTE = {
    'GE': 'E2',
    'GA': 'A2',
    'GD': 'D3',
    'GG': 'G3',
    'GB': 'B3',
    'Ge': 'E4'
};


let validMidiValue = /^M[0-9]{1,3}$/;
let validGuitarValue = /^G[EADGBe][0-9]{1,2}$/;

function midiToFreq(midiValue) {
    if((midiValue < 0) || (midiValue > 127)) {
        throw "Error, invalid midi value...";
    }
    
    return 2 ** ((midiValue - 69) / 12) * 440;
}

let keywords = {
    "set": true,
    "track": true,
    "play": true,
    "rest": true,
    "repeat": true
};

let literals = {
    "integer": /^[+-]?[0-9]+$/,
    "float": /^[+-]?([0-9]*[.])?[0-9]+$/
};

const TERMINATOR = "\n";

let blockedItems = {
    // Start char, end char, escape char, can go past terminator.
    "//": ["\n", null, false, "comment"],
    "/*": ["*/", null, true, "comment"],
    '"': ['"', null, false, "literal:string"]
};

let specialChars = {
    "{": "blockstart",
    "}": "blockend"
};

let whiteSpace = /^\s$/;
let identifier = /^[a-zA-Z$_#]+[a-zA-Z0-9$_#]*$/;

function errorMsg(lineNum, msg) {
    return "Error: Line Number " + lineNum + ", " + msg;
}

function parseWord(word, lineNum, charOffset, lazyEval = false) {
    let s = null;
    let off = charOffset - word.length;
    
    for(let s in blockedItems) {
        if(word.startsWith(s)) {
            let [term, escapeChar, escapeNewLine, tokenName] = blockedItems[s];
            return [tokenName, word, lineNum, off];
        }
    }
    
    if(word in specialChars) return [specialChars[word], word, lineNum, off];
    if(word in keywords) return ["keyword", word, lineNum, off];
    if(word == TERMINATOR) return ["terminator", word, lineNum, off];
    if(word.match(identifier) != null) return ["identifier", word, lineNum, off];
    
    for(let litType in literals) {
        let re = literals[litType];
        if(word.match(re) != null) return ["literal:" + litType, word, lineNum, off];
    }
    
    if(!lazyEval) throw errorMsg(lineNum, "Unknown token type: " + word);
    return [null, word, lineNum, off];
}

function toWord(charList) {
    let result = charList.join("");
    charList.length = 0;
    return result;
}

function tokenize(input, lazyEval = false) {
    let latestWord = [];
    let tokens = [];
    let lastToken = null;
    let lineNum = 1;
    let charOffset = 0;
    let innerState = [null, 0];
    
    input += "\n";
    
    for(let char of input) {
        charOffset++;
        lastToken = (latestWord.length > 0)? latestWord[latestWord.length - 1]: null;
        
        if(innerState[0] != null) {
            latestWord.push(char);
            let [[term, escapeChar, escapeNewLine, tokenName], startLine] = innerState;
            // TODO: escapeChar currently unused....
            
            if(toWord(latestWord.slice(-term.length)) == term) {
                tokens.push(parseWord(toWord(latestWord), lineNum, charOffset, lazyEval));
                innerState = [null, 0];
                continue;
            }
            if((char == TERMINATOR) && !escapeNewLine) {
                if(!lazyEval) throw errorMsg(startLine, "'" + latestWord[0] + "' must be terminated before a new line!");
            }
            if(char == TERMINATOR) lineNum++;
            
            continue;
        }
        else {
            for(let startChar in blockedItems) {
                let endPart = toWord(latestWord.slice((-startChar.length) + 1)) + char;
                
                if(endPart == startChar) {
                    innerState = [blockedItems[endPart], lineNum];
                    latestWord = latestWord.slice(0, (-startChar.length) + 1);
                    if(latestWord.length > 0) tokens.push(parseWord(toWord(latestWord), lineNum, charOffset - startChar.length, lazyEval));
                    latestWord.push(endPart);
                    break;
                }
            }
            
            if(innerState[0] != null) {
                continue;
            }
        }
        
        
        if(char == TERMINATOR || char.match(whiteSpace) != null) {
            if(latestWord.length > 0) tokens.push(parseWord(toWord(latestWord), lineNum, charOffset - 1, lazyEval));
            if(char == TERMINATOR) {
                tokens.push(parseWord(char, lineNum, charOffset, lazyEval));
                lineNum++;
            }
        }
        else if(char in specialChars) {
            if(latestWord.length > 0) tokens.push(parseWord(toWord(latestWord), lineNum, charOffset - 1, lazyEval));
            tokens.push(parseWord(char, lineNum, charOffset, lazyEval));
        }
        else {
            latestWord.push(char);
        }
    }
    
    if(innerState[0] != null) {
        let [[term, escapeChar, escapeNewLine, tokenName], startLine] = innerState;
        if(!lazyEval) throw errorMsg(startLine, "'" + latestWord[0] + "' not terminated, must be terminated with '" + term + "'.");
    }
    
    return tokens;
}

class Instruction {
    constructor() {}
    
    // Check if current tokens are of this instruction type. Return true or false.
    static isType(tokens, index) {
        throw "Not Implemented!";
    }
    
    // Parse instruction from this location. Throw error if invalid. 
    // Should return instance of this class...
    static parse(tokens, index) {
        throw "Not Implemented!";
    }
    
    // Execute the instruction, adding it's result to the result object....
    exec(resultObject) {
        throw "Not Implemented!";
    }
}

function getVariable(resultObject, name, lineNumber) {
    resultObject.variables = resultObject.variables ?? {};
    
    if(name in resultObject.variables) return resultObject.variables[name];
    // If global attribute exists, we look in it for variables we didn't find...
    if("global" in resultObject) return getVariable(resultObject.global, name, lineNumber);
    
    if(name in NOTE_TO_MIDI) name = "M" + NOTE_TO_MIDI[name];
    if(name.match(validGuitarValue) != null) {
        let gString = name.slice(0, 2);
        let fretNum = +name.slice(2);
        name = "M" + (NOTE_TO_MIDI[GUITAR_TO_NOTE[gString]] + fretNum);
    }
    if(name.match(validMidiValue) != null) {
        let mNum = Number(name.slice(1));
        if(mNum >= 0 && mNum <= 127) return midiToFreq(mNum);
    }
    
    throw errorMsg(lineNumber, "Variable " + name + " is not defined!");
}

const VALUE_CONV_TABLE = {
    "literal:string": String,
    "literal:integer": Number,
    "literal:float": Number
};

function getValue(type, value) {
    return VALUE_CONV_TABLE[type](value);
}

function validateTerminator(type, string, line) {
    if(type != "terminator") throw errorMsg(line, "Command must end with a termination character: '" + (string == "\n")? "ENTER": string + "'");
}

class SetValue extends Instruction {
    constructor(name, valueType, value, lineNum) {
        super();
        this.name = name;
        this.valueType = valueType;
        this.value = value;
        this.line = lineNum;
    }
    
    static isType(tokens, index) {
        let [type, name, , ] = tokens[index];
        return (type == "keyword" && name == "set");
    }
    
    static parse(tokens, index) {
        let [word, ident, idOrNum, term] = tokens.slice(index, index + 4);
        validateTerminator(...term);
        if(word[0] != "keyword" || word[1] != "set") throw errorMsg(word[2], "Not a set command!");
        if(ident[0] != "identifier") throw errorMsg(ident[2], "First argument to set must be an identifier, not a " + ident[0]);
        if((idOrNum[0] != "identifier") && !(idOrNum[0].startsWith("literal"))) throw errorMsg(idOrNum[2], "Second argument must be a literal or identifier!");
        
        return [new this(ident[1], idOrNum[0], idOrNum[1], idOrNum[2]), index + 4];
    }
    
    exec(resultObject) {
        resultObject.variables = resultObject.variables ?? {};

        if(this.valueType == "identifier") {
            resultObject.variables[this.name] = getVariable(resultObject, this.value, this.line);
        }
        else {
            resultObject.variables[this.name] = getValue(this.valueType, this.value);
        }
    }
}

class PlayNote extends Instruction {
    
    static VALID_ARG_TYPES = {
        "identifier": getVariable,
        "literal:integer": (obj, name, line) => getValue("literal:integer", name),
        "literal:float": (obj, name, line) => getValue("literal:float", name)
    }
    
    constructor(noteType, note, durationType, duration, lineNum) {
        super();
        this.noteType = noteType;
        this.note = note;
        this.durationType = durationType;
        this.duration = duration;
        this.line = lineNum;
    }
    
    static isType(tokens, index) {
        let [type, name, , ] = tokens[index];
        return (type == "keyword" && name == "play");
    }
    
    static isValidArgument(type, value, line) {
        // Supported literal types...
        if(!(type in PlayNote.VALID_ARG_TYPES)) throw errorMsg(line, "Argument must be an integer, float, or variable...");
    }
    
    static parse(tokens, index) {
        let [word, note, duration, term] = tokens.slice(index, index + 4);
        validateTerminator(...term);
        if(word[0] != "keyword" || word[1] != "play") throw errorMsg(word[2], "Not a play command!");
        PlayNote.isValidArgument(...note);
        PlayNote.isValidArgument(...duration);   
        
        return [new this(note[0], note[1], duration[0], duration[1], word[2]), index + 4];
    }
    
    exec(resultObject) {
        resultObject.notes = resultObject.notes ?? [];
        
        let note = PlayNote.VALID_ARG_TYPES[this.noteType](resultObject, this.note, this.line);
        let duration = PlayNote.VALID_ARG_TYPES[this.durationType](resultObject, this.duration, this.line);
        
        if(typeof(note) == "string" || typeof(duration) == "string") throw errorMsg(this.line, "Note value and duration must be numbers, not strings!");
        
        resultObject.notes.push(["play", note, duration]);
    }
}

class Rest extends Instruction {
    constructor(durationType, duration, lineNum) {
        super();
        this.durationType = durationType;
        this.duration = duration;
        this.line = lineNum;
    }
    
    static isType(tokens, index) {
        let [type, name, , ] = tokens[index];
        return (type == "keyword" && name == "rest");
    }
    
    static parse(tokens, index) {
        let [word, duration, term] = tokens.slice(index, index + 3);
        validateTerminator(...term);
        if(word[0] != "keyword" || word[1] != "rest") throw errorMsg(word[2], "Not a rest command!");
        PlayNote.isValidArgument(...duration);   
        
        return [new this(duration[0], duration[1], word[2]), index + 3];
    }
    
    exec(resultObject) {
        resultObject.notes = resultObject.notes ?? [];
        
        let duration = PlayNote.VALID_ARG_TYPES[this.durationType](resultObject, this.duration, this.line);
        
        if(typeof(duration) == "string") throw errorMsg(this.line, "The duration must be a number, not a string!");
        
        resultObject.notes.push(["rest", duration]);
    }
}

class Block extends Instruction {
    constructor(subTokenList, instructionTypes) {
        super();
        this.instructions = parse(subTokenList, instructionTypes);
    }
    
    static isType(tokens, index) {
        let [type, name, , ] = tokens[index];
        return (type == "blockstart" && name == "{");
    }
    
    static parse(tokens, index, instructionTypes = []) {
        if(!this.isType(tokens, index)) throw errorMsg(tokens[index][2], "Not a block!");
        let depth = 1;
        
        for(let i = index + 1; i < tokens.length; i++) {
            let [type, name, line] = tokens[i];
            
            if(type == "blockstart") depth++;
            if(type == "blockend") depth--;
            
            if(depth <= 0) {
                // We add an extra terminator to allow a bracket to end on the same line as a command...
                // If there is already a terminator a no-op occurs, so this works fine.
                let subList = tokens.slice(index + 1, i);
                subList.push(["terminator", null, line]);
                return [new this(subList, instructionTypes), i + 1];
            }
        }
        
        throw errorMsg(tokens[index][2], "'{' was never closed with a matching '}'.");
    }
    
    exec(resultObject) {
        for(let inst of this.instructions) {
            inst.exec(resultObject);
        }
    }
}

class Track extends Instruction {
    constructor(name, block) {
        super();
        this.name = name;
        this.block = block;
    }
    
    static isType(tokens, index) {
        let [type, name, , ] = tokens[index];
        return (type == "keyword" && name == "track");
    }
    
    static parse(tokens, index) {
        if(!this.isType(tokens, index)) throw errorMsg(tokens[index][2], "Not a track!");
        
        let [word, name, op1, op2] = tokens.slice(index, index + 4);
        if(name[0] != "identifier") throw errorMsg(name[2], "Not an identifier, track name must be an identifier.");
        
        if(op1[0] == "blockstart") {
            let [obj, newLoc] = Block.parse(tokens, index + 2, INNER_SCOPE_INSTRUCTIONS);
            return [new this(name[1], obj), newLoc];
        }
        
        if(op1[0] == "terminator" && op2[0] == "blockstart") {
            let [obj, newLoc] = Block.parse(tokens, index + 3, INNER_SCOPE_INSTRUCTIONS);
            return [new this(name[1], obj), newLoc];
        }
        
        throw errorMsg(op1[2], "Track identifier must be followed by a code block!");
    }
    
    exec(resultObject) {
        resultObject.tracks = resultObject.tracks ?? {};
        
        resultObject.tracks[this.name] = {global: resultObject};
        // Construct global reference, used for global variable access when variable isn't found in local scope...
        
        this.block.exec(resultObject.tracks[this.name]);
    }
}

class Repeat extends Instruction {
    constructor(nRepsType, numReps, line, block) {
        super();
        this.nRepsType = nRepsType;
        this.numReps = numReps;
        this.block = block;
        this.line = line;
    }
    
    static isType(tokens, index) {
        let [type, name, , ] = tokens[index];
        return (type == "keyword" && name == "repeat");
    }
    
    static parse(tokens, index) {
        if(!this.isType(tokens, index)) throw errorMsg(tokens[index][2], "Not a repeat!");
        
        let [word, name, op1, op2] = tokens.slice(index, index + 4);
        if(name[0] != "identifier" && name[0] != "literal:integer") throw errorMsg(name[2], "Not an identifier or integer, repeat amount must be an identifier or integer.");
        
        if(op1[0] == "blockstart") {
            let [obj, newLoc] = Block.parse(tokens, index + 2, INNER_SCOPE_INSTRUCTIONS);
            return [new this(name[0], name[1], name[2], obj), newLoc];
        }
        
        if(op1[0] == "terminator" && op2[0] == "blockstart") {
            let [obj, newLoc] = Block.parse(tokens, index + 3, INNER_SCOPE_INSTRUCTIONS)
            return [new this(name[0], name[1], name[2], obj), newLoc];
        }
        
        throw errorMsg(op1[2], "Repeat count must be followed by a code block!");
    }
    
    exec(resultObject) {
        let repCount = PlayNote.VALID_ARG_TYPES[this.nRepsType](resultObject, this.numReps, this.line);
        if(repCount != parseInt(repCount)) throw errorMsg(this.line, "Repeat amount must be an integer.");
        
        let repeatObj = {"global": resultObject};
        
        this.block.exec(repeatObj);
        
        resultObject.notes = resultObject.notes ?? [];
        if(repeatObj.notes != null) {
            for(let i = 0; i < repCount; i++) resultObject.notes.push(...repeatObj.notes);
        }
    }
}

class NoOp extends Instruction {
    static isType(tokens, index) {
        let [type, name, , ] = tokens[index];
        return (type == "terminator");
    }
    
    static parse(tokens, index) {
        if(!this.isType(tokens, index)) throw errorMsg(tokens[index][2], "Not a No Op!");
        return [new this(), index + 1];
    }
    
    exec(resultObject) {}
}

const OUTER_SCOPE_INSTRUCTIONS = [SetValue, Track, NoOp];
const INNER_SCOPE_INSTRUCTIONS = [Repeat, PlayNote, Rest, SetValue, NoOp];

function parse(tokens, instructions) {
    // Strip comments...
    let noComments = [];
    for(let token of tokens) {
        if(token[0] != "comment") noComments.push(token);
    }
    
    let finalInstrTree = [];
    
    // Now main code....
    for(let i = 0; i < noComments.length; ) {
        let instrFound = false;
        
        for(let instrType of instructions) {
            if(instrType.isType(noComments, i)) {
                let obj = null;
                [obj, i] = instrType.parse(noComments, i);
                finalInstrTree.push(obj);
                instrFound = true;
                break;
            }
        }
        if(!instrFound) throw errorMsg(noComments[i][2], "SyntaxError, unknown grammar '" + noComments[i][1] + "'.");
    }
    
    return finalInstrTree;
}

function execute(parseTree, preObj = {}) {
    let resultObject = {...preObj};
    for(let instruction of parseTree) {
        instruction.exec(resultObject);
    }
    
    return resultObject;
}

function runMusicLang(code) {
    return execute(parse(tokenize(code), OUTER_SCOPE_INSTRUCTIONS));
}

function getSecondsPerTick(music) {
    let vars = music.variables;
    
    if(vars == null) return 1; 
    
    let validValues = {
        "SECONDS_PER_UNIT": (a) => a,
        "MILLIS_PER_UNIT": (a) => a * 1000,
        "UNITS_PER_SECOND": (a) => 1 / a,
        "UNITS_PER_MILLI": (a) => 1 / (a * 1000),
        "UNITS_PER_MINUTE": (a) => 60 / a
    };
    
    for(let prop in validValues) {
        if(prop in vars) {
            return validValues[prop](vars[prop]);
        }
    }
    
    return 1;
}
