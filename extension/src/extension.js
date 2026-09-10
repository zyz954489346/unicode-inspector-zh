'use strict';
const vscode=require('vscode');
const t=(message,...args)=>vscode.l10n.t(message,...args);
const {Inspector,metadata,script,previous,display,codeLabel}=require('./core');
const SCHEMES=new Set(['file','untitled','vscode-remote','vscode-notebook-cell']);
const CONFIG_KEYS=['allowChinesePunctuation','allowCommonSymbols','allowPinyin','allowedCharacters','allowedCodepointRanges'];
function scriptName(name) {
  const names={Cyrillic:t("Cyrillic"), Greek:t("Greek"), Latin:t("Latin"), Common:t("Common"), Inherited:t("Inherited"), Han:t("Han"), Bopomofo:t("Bopomofo"), Unknown:t("Unknown")};
  return names[name] || name;
}
function markdown(issue) {
  const md=new vscode.MarkdownString(); md.isTrusted=false; md.supportHtml=false;
  md.appendText(`${issue.kind}\n\n${t('Character: {0}    {1}',display(issue.char,t),codeLabel(issue.code))}\n\n${issue.name}\n${scriptName(issue.script)}\n\n${issue.reason}\n\n${t('Unicode data: {0}. Advisory only; no automatic replacement.',require('./unicode-data.json').version)}`);
  return md;
}
function activate(context) {
  const states=new Map(); let disposed=false;
  const collection=vscode.languages.createDiagnosticCollection('unicode-inspector');
  const decoration=vscode.window.createTextEditorDecorationType({border:'1px solid',borderColor:new vscode.ThemeColor('editorWarning.foreground'),borderRadius:'2px',overviewRulerColor:new vscode.ThemeColor('editorWarning.foreground'),overviewRulerLane:vscode.OverviewRulerLane.Right,rangeBehavior:vscode.DecorationRangeBehavior.ClosedClosed});
  const status=vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,80); status.command='unicodeInspector.listIssues';
  const config=doc=>vscode.workspace.getConfiguration('unicodeInspector',doc.uri);
  const options=cfg=>Object.fromEntries(CONFIG_KEYS.map(k=>[k,cfg.get(k)]));
  const eligible=doc=>!doc.isClosed && SCHEMES.has(doc.uri.scheme);
  const key=doc=>doc.uri.toString();
  function updateStatus() {
    const editor=vscode.window.activeTextEditor;
    if(!editor || !eligible(editor.document) || !config(editor.document).get('enabled',true)) { status.hide(); return; }
    const state=states.get(key(editor.document));
    status.text=state ? state.status : '$(search) Unicode';
    status.tooltip=state && state.note ? state.note : t("Unicode Inspector: click to review characters and explanations"); status.show();
  }
  function decorate(doc,issues) {
    const ranges=issues.map(i=>new vscode.Range(doc.positionAt(i.offset),doc.positionAt(i.offset+i.length)));
    for(const editor of vscode.window.visibleTextEditors) if(editor.document.uri.toString()===key(doc)) editor.setDecorations(decoration,ranges);
  }
  function reset(doc) { collection.delete(doc.uri); decorate(doc,[]); }
  function cancel(doc) { const state=states.get(key(doc)); if(state && state.timer) clearTimeout(state.timer); states.delete(key(doc)); }
  async function scan(doc,state) {
    const current=()=>!disposed && !doc.isClosed && states.get(key(doc))===state && doc.version===state.version;
    if(!eligible(doc) || disposed || states.get(key(doc))!==state) return undefined;
    state.version=doc.version; const cfg=config(doc);
    if(!cfg.get('enabled',true)) { reset(doc); state.issues=[]; state.pending=false; updateStatus(); return state; }
    const text=doc.getText(), limit=cfg.get('maxFileCharacters',5000000);
    if(limit>0 && text.length>limit) {
      reset(doc); state.pending=false; state.issues=[]; state.skipped=true;
      state.status=t("$(warning) Unicode: not scanned"); state.note=t("Exceeds the scan limit of {0} UTF-16 code units. Adjust unicodeInspector.maxFileCharacters; 0 means unlimited.",limit);
      const d=new vscode.Diagnostic(new vscode.Range(0,0,0,0),state.note,vscode.DiagnosticSeverity.Information); d.source='Unicode Inspector'; collection.set(doc.uri,[d]); updateStatus(); return state;
    }
    try {
      const engine=new Inspector(options(cfg),t); const issues=await engine.scanAsync(text,()=>!current());
      if(!current() || !issues) return undefined;
      state.issues=issues; state.pending=false;
      state.status=`${issues.length ? '$(warning)' : '$(check)'} ${t('Unicode: {0}',issues.length)}`;
      state.note=issues.length ? t("{0} characters to review; click for explanations",issues.length) : t("Unicode scan complete: no characters to review");
      const diagnostics=issues.map(issue=>{
        const range=new vscode.Range(doc.positionAt(issue.offset),doc.positionAt(issue.offset+issue.length));
        const severity=issue.kindId==='unlisted' ? vscode.DiagnosticSeverity.Information : vscode.DiagnosticSeverity.Warning;
        const d=new vscode.Diagnostic(range,`${issue.kind} · ${codeLabel(issue.code)} · ${issue.name}\n${issue.reason}`,severity); d.source='Unicode Inspector'; d.code=codeLabel(issue.code); return d;
      });
      collection.set(doc.uri,diagnostics); decorate(doc,issues); updateStatus(); return state;
    } catch(error) {
      if(!current()) return undefined;
      reset(doc); state.pending=false; state.issues=[]; state.error=true;
      state.status=t("$(error) Unicode: scan failed"); state.note=String(error.message || error);
      const d=new vscode.Diagnostic(new vscode.Range(0,0,0,0),t("Unicode Inspector scan failed: {0}",state.note),vscode.DiagnosticSeverity.Error); d.source='Unicode Inspector'; collection.set(doc.uri,[d]); updateStatus(); return state;
    }
  }
  function schedule(doc,immediate=false) {
    cancel(doc);
    if(!eligible(doc) || disposed) return undefined;
    reset(doc);
    const state={version:doc.version,issues:[],pending:true,status:t("$(sync~spin) Unicode: scanning"),promise:undefined}; states.set(key(doc),state);
    const start=()=>{ state.timer=undefined; state.promise=scan(doc,state); return state.promise; };
    if(immediate) start(); else state.timer=setTimeout(start,config(doc).get('debounceMs',350));
    updateStatus(); return state;
  }
  async function ready(doc) {
    if(!eligible(doc)) return undefined;
    if(!config(doc).get('enabled',true)) { vscode.window.showInformationMessage(t("Unicode Inspector is disabled for this document.")); return undefined; }
    let state=states.get(key(doc));
    if(!state || state.version!==doc.version || state.pending) state=schedule(doc,true);
    if(state && state.promise) await state.promise;
    if(!state || states.get(key(doc))!==state || state.pending) return undefined;
    if(state.skipped || state.error) { vscode.window.showWarningMessage(state.note); return undefined; }
    return state;
  }
  async function jump(editor,issue) {
    const range=new vscode.Range(editor.document.positionAt(issue.offset),editor.document.positionAt(issue.offset+issue.length));
    editor.selection=new vscode.Selection(range.start,range.end); editor.revealRange(range,vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    await vscode.commands.executeCommand('editor.action.showHover');
  }
  context.subscriptions.push(collection,decoration,status,
    vscode.workspace.onDidOpenTextDocument(doc=>schedule(doc)),
    vscode.workspace.onDidChangeTextDocument(e=>{if(e.contentChanges.length) schedule(e.document);}),
    vscode.workspace.onDidCloseTextDocument(doc=>{cancel(doc);collection.delete(doc.uri);updateStatus();}),
    vscode.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration('unicodeInspector')) for(const doc of vscode.workspace.textDocuments) schedule(doc,true);}),
    vscode.window.onDidChangeActiveTextEditor(editor=>{if(editor && !states.has(key(editor.document))) schedule(editor.document);updateStatus();}),
    vscode.window.onDidChangeVisibleTextEditors(editors=>{for(const editor of editors){const state=states.get(key(editor.document));if(state && !state.pending && state.version===editor.document.version) decorate(editor.document,state.issues);else if(!state) schedule(editor.document);}}),
    vscode.languages.registerHoverProvider(Array.from(SCHEMES,scheme=>({scheme,language:'*'})),{
      provideHover(doc,position) {
        const state=states.get(key(doc)); if(!state || state.pending || state.version!==doc.version) return undefined;
        const offset=doc.offsetAt(position);
        let lo=0,hi=state.issues.length;
        while(lo<hi){const mid=(lo+hi)>>>1;if(state.issues[mid].offset<=offset)lo=mid+1;else hi=mid;}
        const issue=state.issues[lo-1]; if(!issue || offset>=issue.offset+issue.length) return undefined;
        return new vscode.Hover(markdown(issue),new vscode.Range(doc.positionAt(issue.offset),doc.positionAt(issue.offset+issue.length)));
      }
    }),
    vscode.commands.registerCommand('unicodeInspector.listIssues',async()=>{
      const editor=vscode.window.activeTextEditor; if(!editor) return;
      const doc=editor.document, state=await ready(doc); if(!state) return;
      if(!state.issues.length) {vscode.window.showInformationMessage(t("Unicode: no characters to review"));return;}
      const entries=state.issues.map(issue=>{const p=doc.positionAt(issue.offset);return {label:`${p.line+1}:${p.character+1}  ${codeLabel(issue.code)}  ${issue.kind}`,description:issue.name,detail:issue.reason,issue};});
      const chosen=await vscode.window.showQuickPick(entries,{placeHolder:t("Select a character to see its explanation and location"),matchOnDescription:true,matchOnDetail:true});
      if(!chosen) return;
      if(doc.isClosed || doc.version!==state.version){vscode.window.showInformationMessage(t("The document changed. Open the issue list again."));return;}
      const target=await vscode.window.showTextDocument(doc); await jump(target,chosen.issue);
    }),
    vscode.commands.registerCommand('unicodeInspector.nextIssue',async()=>{
      const editor=vscode.window.activeTextEditor; if(!editor)return;
      const state=await ready(editor.document); if(!state)return;
      if(!state.issues.length){vscode.window.showInformationMessage(t("Unicode: no characters to review"));return;}
      const offset=editor.document.offsetAt(editor.selection.start);
      await jump(editor,state.issues.find(i=>i.offset>offset) || state.issues[0]);
    }),
    vscode.commands.registerCommand('unicodeInspector.explainCharacter',async()=>{
      const editor=vscode.window.activeTextEditor; if(!editor)return;
      const doc=editor.document,text=doc.getText(); let offset=doc.offsetAt(editor.selection.start); if(offset>=text.length)return;
      if(text.charCodeAt(offset)>=0xdc00 && text.charCodeAt(offset)<=0xdfff){const p=previous(text,offset+1);if(p)offset=p.start;}
      try {
        const engine=new Inspector(options(config(doc)),t); let issue=engine.classify(text,offset);
        if(!issue){const char=String.fromCodePoint(text.codePointAt(offset)),cp=char.codePointAt(0),[name,category]=metadata(cp);issue={char,code:cp,name,category,script:script(cp),kind:t("Allowed character"),reason:t("Matches the current Chinese, ASCII, or custom allowlist rules.")};}
        await vscode.window.showQuickPick([{label:`${display(issue.char,t)}  ${codeLabel(issue.code)}  ${issue.kind}`,description:issue.name,detail:issue.reason}],{placeHolder:t("Character explanation (read-only; text is unchanged)")});
      } catch(error){vscode.window.showErrorMessage(t("Unicode: {0}",error.message));}
    }),
    vscode.commands.registerCommand('unicodeInspector.rescan',async()=>{const e=vscode.window.activeTextEditor;if(e){const s=schedule(e.document,true);if(s)await s.promise;}}),
    vscode.commands.registerCommand('unicodeInspector.openSettings',()=>vscode.commands.executeCommand('workbench.action.openSettings',`@ext:${context.extension.id}`)),
    {dispose(){disposed=true;for(const state of states.values())if(state.timer)clearTimeout(state.timer);states.clear();}}
  );
  for(const doc of vscode.workspace.textDocuments) schedule(doc);
  return {ready};
}
module.exports={activate,markdown};
