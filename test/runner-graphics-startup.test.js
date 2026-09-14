import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';

test('an early start request does not misreport shader preparation as a graphics failure',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('function start() {');
  const guard=source.slice(start,source.indexOf('// A results-screen retry',start))+'}';
  runInNewContext(guard+';start();',{graphicsReady:false,graphicsError:()=>{throw Error('false failure');}});
});

test('startup keeps Play disabled during preparation and never overrides a graphics interruption',async()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const block=source.slice(source.indexOf('let view;'),source.indexOf('let currentMission ='));
  for(const interrupted of [false,true]) {
    let done,focus=0;
    const play={disabled:true,focus(){focus++;}};
    const body={};
    const context={graphicsReady:false,state:'menu',document:{body,activeElement:body},$:()=>play,
      createView:()=>({prepareShaders:()=>Promise.resolve(true)}),
      prepareFirstFrame:()=>new Promise(resolve=>{done=resolve;}),
      playLabel:()=> 'Run',graphicsError:()=>{throw Error('unexpected');}};
    runInNewContext(block,context);
    assert.equal(play.disabled,true);
    assert.equal(play.textContent,'Preparing the trail…');
    if(interrupted)context.state='graphics-error';
    done(false);await Promise.resolve();
    assert.equal(context.graphicsReady,!interrupted);
    assert.equal(play.disabled,interrupted);
    assert.equal(focus,interrupted?0:1);
  }
});

test('finishing shader preparation preserves a player-selected menu control',async()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const block=source.slice(source.indexOf('let view;'),source.indexOf('let currentMission ='));
  let done,focus=0;
  const play={disabled:true,focus(){focus++;}};
  const audio={id:'audio'},document={body:{},activeElement:audio};
  const context={graphicsReady:false,state:'menu',document,$:()=>play,
    createView:()=>({prepareShaders:()=>Promise.resolve(true)}),
    prepareFirstFrame:()=>new Promise(resolve=>{done=resolve;}),playLabel:()=> 'Run',
    graphicsError:()=>{throw Error('unexpected');}};
  runInNewContext(block,context);done(true);await Promise.resolve();
  assert.equal(context.graphicsReady,true);assert.equal(play.disabled,false);
  assert.equal(focus,0);assert.equal(document.activeElement,audio);
});

test('dialogs focus a usable target while their Run button is preparing',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const block=source.slice(source.indexOf('function focusOverlay()'),source.indexOf('function setState(next)'));
  for(const [disabled,hidden,expected] of [[false,false,'overlay-primary'],[true,false,'home'],[true,true,'overlay-title']]){
    let focused;
    const nodes=Object.fromEntries(['overlay-primary','home','overlay-title'].map(id=>[id,{focus(){focused=id;}}]));
    nodes['overlay-primary'].disabled=disabled;nodes.home.hidden=hidden;
    runInNewContext(block+';focusOverlay();',{$:id=>nodes[id]});
    assert.equal(focused,expected);
  }
});

test('WebGL startup failure stays 3D-first and exposes Chrome setup steps',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../runner/index.html',import.meta.url),'utf8');
  assert.doesNotMatch(source,/createFallbackView|canvas-2d-fallback/);
  assert.match(source,/dataset\.renderer = ['"]webgl-required['"]/);
  assert.match(source,/Try 3D again/);
  assert.match(html,/id="graphics-mobile-help"/);
  assert.match(html,/Close other games or 3D-heavy tabs/);
  for(const phrase of ['Use graphics acceleration when available','Relaunch Chrome','Chrome Settings → System'])
    assert.match(html,new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('tilt settings stay inert until a mobile capability check opts in',()=>{
  const html=readFileSync(new URL('../runner/index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  assert.match(html,/<template id="tilt-settings-template">[\s\S]*<details id="tilt-settings">/);
  assert.doesNotMatch(html,/<details id="tilt-settings">[^]*<\/details>\s*<p id="run-lesson">/);
  assert.match(app,/template\?\.content\.firstElementChild\?\.cloneNode\(true\)/);
  assert.match(app,/supportsMobileTilt\(window\)/);
});

test('desktop game bundle does not contain the optional motion adapter',()=>{
  const game=readFileSync(new URL('../dist/runner/game.js',import.meta.url),'utf8');
  const tilt=readFileSync(new URL('../dist/runner/tilt-controls.js',import.meta.url),'utf8');
  assert.doesNotMatch(game,/DeviceOrientation/);
  assert.doesNotMatch(game,/deviceorientation/);
  assert.match(game,/import\("\.\/tilt-controls\.js"\)/);
  assert.match(tilt,/DeviceOrientation/);
  assert.match(tilt,/installTiltControls/);
});
