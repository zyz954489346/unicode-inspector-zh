'use strict';
const data = require('./unicode-data.json');
const {format} = require('./i18n');
const allowed = require('./allowed.json');
const PUNCT = new Set(allowed.punctuation), SYMBOLS = new Set(allowed.symbols), PINYIN = new Set(allowed.pinyin);
const TONES = new Set([0x300,0x301,0x302,0x304,0x308,0x30c]);
const BIDI = new Set([0x61c,0x200e,0x200f,0x202a,0x202b,0x202c,0x202d,0x202e,0x2066,0x2067,0x2068,0x2069]);
const VARIATION = [[0xfe00,0xfe0f],[0xe0100,0xe01ef]];
function inRanges(cp,ranges) { return ranges.some(([a,b]) => a<=cp && cp<=b); }
function findRange(cp,ranges) {
  let lo=0, hi=ranges.length;
  while(lo<hi) { const mid=(lo+hi)>>>1; if(ranges[mid][0]<=cp) lo=mid+1; else hi=mid; }
  return lo>0 && cp<=ranges[lo-1][1] ? ranges[lo-1] : undefined;
}
function script(cp) { const range=findRange(cp,data.scripts); return range ? range[2] : 'Unknown'; }
function metadata(cp) {
  const entry=data.characters[cp]; if(entry) return entry;
  const range=findRange(cp,data.name_ranges);
  if(range) return [(range[2].includes('CJK') ? 'CJK UNIFIED IDEOGRAPH-' : range[2]+'-')+cp.toString(16).toUpperCase(),range[3]];
  return ['UNASSIGNED','Cn'];
}
function previous(text,offset) {
  if(offset<=0) return undefined;
  let start=offset-1; const unit=text.charCodeAt(start);
  if(unit>=0xdc00 && unit<=0xdfff && start>0) { const high=text.charCodeAt(start-1); if(high>=0xd800 && high<=0xdbff) start--; }
  return {start,char:String.fromCodePoint(text.codePointAt(start))};
}
function codeLabel(cp) { return 'U+'+cp.toString(16).toUpperCase().padStart(4,'0'); }
function display(char,t=format) {
  const cp=char.codePointAt(0), cat=metadata(cp)[1];
  return /^[CZ]/.test(cat) ? t("(whitespace or invisible character)") : char;
}
function safeTarget(target) {
  return Array.from(target,c=>/^[CZ]/.test(metadata(c.codePointAt(0))[1]) ? codeLabel(c.codePointAt(0)) : c).join('');
}
class Inspector {
  constructor(config={},t=format) {
    this.t=t;
    this.config=config; this.extra=new Set(config.allowedCharacters || '');
    this.ranges=(config.allowedCodepointRanges || []).map(value=>{
      if(typeof value!=='string' || !/^(?:U\+)?[0-9A-F]+-(?:U\+)?[0-9A-F]+$/i.test(value)) throw new Error(t("Expected a hexadecimal range such as 3400-4DBF: {0}",value));
      const [a,b]=value.toUpperCase().replace(/U\+/g,'').split('-').map(v=>parseInt(v,16));
      if(a>b || b>0x10ffff) throw new Error(t("Invalid Unicode range: {0}",value));
      return [a,b];
    });
  }
  enabled(key) { return this.config[key]!==false; }
  allowed(char) {
    const cp=char.codePointAt(0), sc=script(cp);
    if(sc==='Han' || sc==='Bopomofo') return true;
    if((inRanges(cp,[[0x2ff0,0x2fff],[0x31c0,0x31ef]]) || cp===0x3006) && metadata(cp)[1]!=='Cn') return true;
    if(this.extra.has(char) || inRanges(cp,this.ranges)) return true;
    if(this.enabled('allowChinesePunctuation')) {
      if(PUNCT.has(char)) return true;
      if(inRanges(cp,[[0x3001,0x303f],[0xfe10,0xfe1f],[0xfe30,0xfe6f]]) && metadata(cp)[1].startsWith('P')) return true;
    }
    return (this.enabled('allowCommonSymbols') && SYMBOLS.has(char)) || (this.enabled('allowPinyin') && PINYIN.has(char));
  }
  classify(text,offset) {
    if(offset<0 || offset>=text.length) return undefined;
    const t=this.t;
    const cp=text.codePointAt(offset), char=String.fromCodePoint(cp);
    if('\t\r\n'.includes(char) || (cp>=32 && cp<=126) || this.allowed(char)) return undefined;
    const [name,category]=metadata(cp);
    let kind,kindId,reason,target;
    if(inRanges(cp,VARIATION)) {
      const prev=previous(text,offset);
      if(prev && script(prev.char.codePointAt(0))==='Han') return undefined;
      kindId='variation'; kind=t("Variation selector"); reason=t("Does not immediately follow a Han character. It may belong to a valid sequence such as emoji; check the context.");
    } else if(BIDI.has(cp)) {
      kindId='bidi'; kind=t("Bidirectional control"); reason=t("Can change the display order of text; the visual order may differ from the stored order.");
    } else if(category==='Cf') {
      kindId='format'; kind=t("Invisible format character"); reason=t("Usually invisible; may affect text joining, line breaks, or string comparisons.");
    } else if(category==='Cs') {
      kindId='surrogate'; kind=t("Unpaired surrogate"); reason=t("An isolated UTF-16 surrogate is not a Unicode scalar value. Check the source text or encoding.");
    } else if(category==='Cc') {
      kindId='control'; kind=t("Control character"); reason=t("Not ordinary text or a standard tab, carriage return, or line feed.");
    } else if(category.startsWith('Z')) {
      kindId='whitespace'; kind=t("Unusual whitespace"); reason=t("Differs from an ordinary space (U+0020) and may cause identifier comparisons to fail.");
    } else if(inRanges(cp,[[0xff10,0xff19],[0xff21,0xff3a],[0xff41,0xff5a]])) {
      target=String.fromCodePoint(cp-0xfee0); kindId='fullwidth'; kind=t("Fullwidth letter or digit"); reason=t("Corresponds to the ASCII character “{0}”, but has a different Unicode code point.",target);
    } else if(category.startsWith('M')) {
      if(this.enabled('allowPinyin') && TONES.has(cp)) {
        let prev=previous(text,offset), depth=0;
        // Pinyin needs at most a vowel modifier and one tone. Bound backward
        // traversal so long runs of combining marks cannot cause quadratic work.
        while(prev && TONES.has(prev.char.codePointAt(0)) && depth++<3) prev=previous(text,prev.start);
        if(prev && /^[aeioumn]$/i.test(prev.char.normalize('NFD')[0])) {
          const marks=Array.from(text.slice(prev.start,offset+char.length).normalize('NFD')).slice(1).map(c=>c.codePointAt(0));
          const base=prev.char.normalize('NFD')[0].toLowerCase();
          const modifiers=marks.filter(c=>c===0x308 || c===0x302);
          const tones=marks.filter(c=>c!==0x308 && c!==0x302);
          const modifierOK=modifiers.length===0 || (modifiers.length===1 && ((base==='u' && modifiers[0]===0x308) || (base==='e' && modifiers[0]===0x302)));
          if(modifierOK && tones.length<=1) return undefined;
        }
      }
      kindId='combining'; kind=t("Combining mark"); reason=t("Combines visually with adjacent characters; not allowed by the current Chinese/pinyin rules.");
    } else if(data.confusables[cp]) {
      target=data.confusables[cp]; kindId='confusable'; kind=t("Confusable character"); reason=t("The Unicode confusables table maps this to “{0}”. Visual similarity depends on the font; the code points differ.",safeTarget(target));
    } else {
      const normalized=char.normalize('NFKC');
      if(normalized!==char && /^[\x21-\x7e]+$/.test(normalized)) {
        target=normalized; kindId='compatibility'; kind=t("Compatibility character"); reason=t("Compatibility normalization produces “{0}”. The original code point differs; automatic replacement is not implied.",target);
      } else { kindId='unlisted'; kind=t("Character outside the allowlist"); reason=t("Outside the Chinese and custom allowlists. This does not mean the character is incorrect."); }
    }
    return {offset,length:char.length,char,code:cp,name,category,script:script(cp),kindId,kind,reason,target};
  }
  scan(text) {
    const issues=[];
    for(const match of text.matchAll(/[^\x09\x0a\x0d\x20-\x7e]/gu)) { const issue=this.classify(text,match.index); if(issue) issues.push(issue); }
    return issues;
  }
  async scanAsync(text,cancelled=()=>false) {
    const issues=[]; let count=0;
    for(const match of text.matchAll(/[^\x09\x0a\x0d\x20-\x7e]/gu)) {
      if((count++ % 4096)===0) { if(cancelled()) return undefined; await new Promise(resolve=>setImmediate(resolve)); if(cancelled()) return undefined; }
      const issue=this.classify(text,match.index); if(issue) issues.push(issue);
    }
    return cancelled() ? undefined : issues;
  }
}
module.exports={Inspector,data,metadata,script,previous,display,codeLabel};
