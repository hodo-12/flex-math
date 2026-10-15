// Small original synthesized hip-hop loop. Optional, local and key-free.
import {BPM} from './choreography.js';
export function createBeat(){
  let ctx,master,timer=null,next=0,step=0,enabled=false;
  function note(freq,t,length,type,volume,to=freq){
    const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(1,to),t+length);
    g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+length);o.connect(g);g.connect(master);o.start(t);o.stop(t+length+.01);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  function noise(t,length,volume,cutoff){
    const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*length),ctx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
    const n=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();n.buffer=buffer;filter.type='highpass';filter.frequency.value=cutoff;g.gain.value=volume;n.connect(filter);filter.connect(g);g.connect(master);n.start(t);n.onended=()=>{n.disconnect();filter.disconnect();g.disconnect();};
  }
  function schedule(){
    while(next<ctx.currentTime+.12){
      const s=step%16;
      if([0,6,8,11].includes(s))note(125,next,.17,'sine',.85,42);
      if(s===4||s===12){noise(next,.13,.3,1100);note(180,next,.07,'triangle',.18,80);}
      noise(next,.035,s%2?.07:.10,6500);
      if(s%4===0)note([65.41,65.41,77.78,58.27][s/4],next,.24,'triangle',.18);
      next+=60/BPM/4;step++;
    }
  }
  async function setEnabled(value){
    enabled=value;
    if(!value){pause();return false;}
    const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Audio){enabled=false;throw Error('Audio unavailable');}
    if(!ctx){ctx=new Audio();master=ctx.createGain();master.gain.value=.25;master.connect(ctx.destination);}
    await ctx.resume();if(enabled&&!document.hidden){master.gain.setTargetAtTime(.25,ctx.currentTime,.02);next=ctx.currentTime+.04;step=0;clearInterval(timer);timer=setInterval(schedule,25);schedule();}return true;
  }
  function pause(){clearInterval(timer);timer=null;if(ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.03);}
  function visibility(){if(document.hidden)pause();else if(enabled)setEnabled(true).catch(()=>{enabled=false;});}
  document.addEventListener('visibilitychange',visibility);
  return {setEnabled,get enabled(){return enabled;},dispose(){enabled=false;pause();document.removeEventListener('visibilitychange',visibility);ctx?.close();}};
}
