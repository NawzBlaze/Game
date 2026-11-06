/* Authored story and functional route metadata; all illustrated artwork remains Kenney's. */
(() => {
  'use strict';
  const chapters=[
    {name:'Garden District',title:'An invitation for everyone',start:0,end:4,asset:'flag_green_a',intro:'The old lantern festival has gone quiet. Postmaster Bea asks a new courier to bring the neighbourhood together again.'},
    {name:'Market District',title:'A celebration takes shape',start:4,end:8,asset:'block_red',intro:'Invitations are arriving, but the market needs supplies. A locked gate and a quiet bridge turn a simple shopping round into a little adventure.'},
    {name:'Golden District',title:'The missing light',start:8,end:12,asset:'star',intro:'The lantern lens is missing. Follow a trail of books, leaves and careful deliveries: the answer may be closer than anyone thinks.'},
    {name:'Harbour District',title:'Across the moving water',start:12,end:18,asset:'water_top',intro:'The harbour has the festival bell, but the tide has shifted the bridges. Neighbours on both banks must work together.'},
    {name:'Hilltop District',title:'One town, one bright night',start:18,end:24,asset:'heart',intro:'The final parcels climb toward the old hilltop post. Every district has sent something. Now the crew must bring it all home.'}
  ].map((chapter,i)=>Object.freeze({...chapter,art:['background_fade_hills','background_fade_trees','background_fade_mushrooms','background_clouds','background_fade_hills'][i]}));
  const letters=[
    ['Bea, the postmaster','The first invitation','Take this invitation to our first neighbour. A festival starts with someone saying yes.','The first neighbour says yes. Bea puts a fresh pin on the route board.'],
    ['Mina, the gardener','Seeds for the welcome arch','Carry these seeds across the garden gap. We can grow a welcome instead of buying one.','Mina promises flowers for every visitor, not just the guests of honour.'],
    ['Otto, the groundskeeper','A ribbon for a tiny helper','The mice have been collecting lost ribbons. Say hello, or give them room as you pass.','A little mouse leaves a golden ribbon beside the postbox.'],
    ['The park neighbours','Invitations for the far park','Nobody on the far side of the park should miss the celebration. Watch the gaps on your way.','The park agrees to host the gathering. Now we need something to celebrate with.'],
    ['Rosa, the baker','The market order','Bring this order to the bakery. The market gate is locked; look for the key above the street.','Rosa starts the ovens. She has enough bread if someone brings the baskets.'],
    ['Rosa and Ivo','Two baskets, two doorsteps','One basket goes to the roof garden; collect the next parcel for the second doorstep.','The bakery and roof garden share their supplies. A whole street joins the plan.'],
    ['Ivo, the repairer','A handle for the lantern','Deliver the repaired handle beyond the gate. The key route is high, so keep your air hop ready.','The lantern can be carried again, but its bright glass lens is still missing.'],
    ['Nell, the bridge keeper','A switch for the crossing','Step on the switch to wake the bridge. Nell will search the far lane for the missing lens.','The bridge moves again. Nell remembers seeing a glint on Golden Lane.'],
    ['Nell','A note from Golden Lane','A breeze runs along this lane. Bring Nell’s note to the neighbour who collects lost things.','The glint was not broken glass. Someone carefully wrapped the lens to keep it safe.'],
    ['The book club','A story for two readers','Deliver to both readers. One of their books contains a clue from the festival’s last bright night.','A margin note says the lens was sent to the repairer, not lost in the street.'],
    ['Ivo','The carefully wrapped lens','This parcel is fragile. Use the platforms and land gently: the whole festival is counting on this little light.','The lens arrives safely. The lantern is ready, but a celebration needs its bell.'],
    ['Bea','A thank-you for Golden Lane','Bring Bea’s thank-you along the last leafy crossing. She has a new route for you at the harbour.','Golden Lane sends its ribbon onward. The next clue waits beside the water.'],
    ['Sal, the harbour keeper','Two harbour messages','Deliver the first message, then pick up the second. The bridge schedule only works if both banks know the plan.','Both banks agree to help. Sal finds the old bell in the harbour store.'],
    ['Sal','A strap for the bell','The striped boardwalk moves under your feet. Bring this strap to the store before the bell is lifted.','The strap fits. The harbour crew starts preparing a safe crossing.'],
    ['The harbour children','The bell’s bouncy padding','The padding parcel bounces loose after a hard landing. Keep it with you through both deliveries.','The children turn a spare ball into padding. Even an awkward parcel has a purpose.'],
    ['Nell','The crossing plan','Wait for each moving bridge instead of rushing. Nell has marked a safer way over the water.','The plan reaches the crew. The bell can cross without anyone taking a needless risk.'],
    ['Sal and Rosa','A supper for the crossing crew','Bring supper along the evening boardwalk. Belts and bridges are busy, but nobody should work hungry.','The crew shares a late supper. Across the water, the hilltop lantern tower appears.'],
    ['Bea','The bell’s arrival notice','Carry the notice beyond the last harbour gate. The hilltop neighbours are waiting to receive the bell.','The bell reaches dry ground. Every harbour neighbour signs the arrival notice.'],
    ['Asha, the hilltop keeper','Two welcome parcels','The hilltop has two neighbours to thank. Deliver both parcels before starting the final climb.','Asha opens the old post. For the first time in years, every district is on its route board.'],
    ['Mina and Asha','Orchard flowers','Carry the flowers through both stops. The orchard sends its first blooms for the lantern arch.','The welcome arch is finished. Its ribbons carry the colours of all five districts.'],
    ['The book club','A song for the bell','One copy goes to the musicians; another waits at the next doorstep. A familiar tune will bring everyone outside.','The musicians learn the old tune. The festival finally has a voice again.'],
    ['Nell','The last bridge ribbon','Cross Bramble Bridge with this ribbon. It marks the safe route for the neighbours following behind.','The last crossing is marked. Nobody has to find their own way in the dark.'],
    ['Rosa and the park neighbours','The shared picnic','Finish both deliveries. These are not supplies for a grand guest: they are a picnic for the whole town.','Blankets cover the grass. There is a place for the crew, the neighbours and a very curious mouse.'],
    ['Every neighbour','The grand delivery','Bring the final parcel to the hilltop post. It contains all the little thank-yous collected along your round.','The bell rings. The lens catches the light. Every doorstep in the neighbourhood has helped make this night possible.']
  ].map(([sender,parcel,request,receipt],index)=>Object.freeze({index,sender,parcel,request,receipt}));
  function chapter(index){return chapters.find(c=>index>=c.start&&index<c.end)||chapters[0]}
  function letter(index){return letters[index]||letters[0]}
  function difficulty(level,index,express=false){
    if(express)return 'EXPRESS · ALL 3 STARS';
    if(index<3)return 'LEARNING ROUTE';
    const weight=(level.ground.length-1)*2+(level.moving?.length||0)*2+(level.dogs?.length||0)+(level.postGate?2:0)+(level.kind?2:0);
    return weight>=8?'TRICKY':weight>=4?'STEADY':'GENTLE';
  }
  window.ParcelCampaign=Object.freeze({chapters:Object.freeze(chapters),letters:Object.freeze(letters),chapter,letter,difficulty});
})();
