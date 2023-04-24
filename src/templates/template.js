import {accordion} from './accordion.js';
import {tabset,tabdeck} from "./tabset.js";
import {rolodex} from "./rolodex.js";
import {form} from "./form.js";
import {simpleForm} from "./simpleForm.js";

export async function initTemplates(){
    return {
        accordion  : accordion.bind(this),
        tabset     : tabset.bind(this),
        tabdeck    : tabdeck.bind(this),
        rolodex    : rolodex.bind(this),
        form       : form.bind(this),
        simpleForm : simpleForm.bind(this),
    }
}
