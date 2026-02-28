/**
 * ADMENSION Daily Motivational Quotes System
 * 365 money-making quotes + 27 rotating GIF backgrounds
 * Inspired by hustle culture / entrepreneurship mindset
 * 
 * Usage: Automatically displays on homepage, rotates daily
 */

(function() {
  'use strict';

  // ===== 365 Daily Quotes (Money/Success/Hustle Theme) =====
  const DAILY_QUOTES = [
    // January (31 days)
    "The only way to get rich is to make money while you sleep.", // Jan 1
    "Don't work for money, make money work for you.",
    "Every dollar you earn is a soldier fighting for your financial freedom.",
    "Broke is a mindset. Rich is a decision.",
    "Your network is your net worth. Build both aggressively.",
    "Time is money, but attention is wealth.",
    "The best investment you can make is in yourself.",
    "Passive income isn't a goal, it's a necessity.",
    "If you're not monetizing your skills, you're leaving money on the table.",
    "Success is rented, not owned. Pay the rent every single day.", // Jan 10
    "Your comfort zone is a prison. Break out or stay broke.",
    "Wealth is built in silence, poverty is celebrated with noise.",
    "Stop trading time for money. Start trading value for freedom.",
    "The market rewards speed. Move fast or get left behind.",
    "Excuses don't build empires. Execution does.",
    "Your competition is working while you sleep. Are you?",
    "Focus is the ultimate currency in a distracted world.",
    "Invest in assets, not liabilities. Simple rule, massive impact.",
    "The difference between rich and poor? Delayed gratification.",
    "Leverage other people's time, money, and expertise. Scale infinitely.", // Jan 20
    "Every 'no' is one step closer to a million-dollar 'yes'.",
    "Your bank account reflects your habits, not your luck.",
    "Think bigger. Act faster. Earn more.",
    "Opportunity doesn't knock twice. When it comes, grab it violently.",
    "Wealth is a skill. Learn it, practice it, master it.",
    "Your excuses are more expensive than your investments.",
    "Broke people focus on spending. Rich people focus on earning.",
    "Automate your income. Multiply your time. Dominate your market.",
    "The grind never stops. Neither should your bank balance.",
    "Cash flow is oxygen for your business. Never let it run out.", // Jan 30
    "Start the year hungry. End it wealthy.", // Jan 31

    // February (28 days)
    "Love what you do, but love money more. Passion doesn't pay bills.",
    "Your income is a reflection of your standards. Raise them.",
    "Wealth isn't about having everything. It's about controlling your time.",
    "Every second counts. Every dollar compounds.",
    "If it doesn't make money, it doesn't make sense.",
    "Build systems, not jobs. Freedom comes from automation.",
    "Poverty is expensive. Wealth is efficient.",
    "Stop saving pennies. Start making thousands.",
    "Your mindset is your operating system. Upgrade it daily.",
    "Risk is everywhere. The biggest risk is staying broke.", // Feb 10
    "Think like a billionaire. Act like a hustler. Live like a king.",
    "Money flows to those who respect it.",
    "You don't need permission to get rich. You need discipline.",
    "Invest in knowledge first. Returns follow automatically.",
    "The marketplace pays for results, not effort.",
    "Your time is finite. Your earning potential is infinite.",
    "Scale or fail. There's no middle ground anymore.",
    "Wealth whispers. Poverty screams. Choose your volume.",
    "Opportunities are disguised as hard work. Most people miss them.",
    "Your future self is watching. Make them proud.", // Feb 20
    "Comfort kills ambition. Discomfort builds empires.",
    "The money you make while you sleep is your freedom score.",
    "Winners focus on winning. Losers focus on winners.",
    "Every day you delay is money you'll never earn back.",
    "Be so good they can't ignore you. Be so rich they can't touch you.",
    "Wealth is about choices. Poverty is about excuses.",
    "Your circle determines your income. Choose wisely.",
    "Stop explaining your vision to people who can't see it.", // Feb 28

    // March (31 days)
    "March forward. Leave poverty behind.",
    "Spring into action. Watch your wealth bloom.",
    "The market doesn't care about your feelings. Neither should you.",
    "Compound interest is the eighth wonder. Use it or lose it.",
    "Your skills are seeds. Your income is the harvest.",
    "Invest now, retire early. Hesitate now, work forever.",
    "Money is a tool. Learn to wield it like a weapon.",
    "The wealthy don't wish for more time. They buy it.",
    "Every hour not spent earning is an hour lost forever.",
    "Build multiple income streams. One river dries up? You're still good.", // Mar 10
    "Poverty is a choice disguised as circumstance.",
    "Your bank account is your scorecard. What's the score?",
    "Think in decades, not days. Wealth is a marathon.",
    "The best time to start was yesterday. The next best time is now.",
    "Cash is king, but cash flow is emperor.",
    "Stop working IN your business. Start working ON your empire.",
    "Revenue solves all problems. Focus on growth.",
    "Your comfort zone is costing you millions.",
    "Leverage is the rich person's secret weapon. Use it.",
    "Every successful person has a story. What's yours?", // Mar 20
    "Broke is temporary. Poor is a mindset. Choose wisely.",
    "Your network opens doors. Your skills keep them open.",
    "Think bigger. Earn faster. Live freer.",
    "The grind today is the freedom tomorrow.",
    "Invest in what appreciates. Avoid what depreciates.",
    "Money doesn't change people. It reveals them.",
    "Wealth is built on value. Create more, earn more.",
    "Your time is your most valuable asset. Monetize it.",
    "The market rewards speed and execution. Be both.",
    "Financial freedom isn't a dream. It's a plan.", // Mar 30
    "End the month richer than you started. Repeat forever.", // Mar 31

    // April (30 days)
    "April showers bring May flowers. Plant money seeds today.",
    "Spring forward. Fall back on your investments.",
    "Opportunities bloom in April. Will you harvest?",
    "The early bird gets the worm. The early hustler gets rich.",
    "Your future is created by what you do today, not tomorrow.",
    "Invest in yourself. The ROI is infinite.",
    "Every dollar saved is a dollar that can multiply.",
    "Wealth is a marathon. Pace yourself but never stop.",
    "Your mindset determines your income. Think rich, get rich.",
    "Passive income is freedom. Active income is a trap.", // Apr 10
    "The market doesn't sleep. Neither should your ambition.",
    "Your bank balance reflects your value to the world. Increase it.",
    "Stop trading hours for dollars. Start trading value for wealth.",
    "Compound your knowledge. Compound your wealth. Compound your freedom.",
    "Risk-takers eat. Risk-avoiders starve.",
    "Your competition is hustling while you hesitate. Move faster.",
    "Wealth is built in private. Poverty is lived in public.",
    "Every 'no' brings you closer to a seven-figure 'yes'.",
    "Your income is a direct result of your standards. Raise them.",
    "Cash flow is oxygen. Cut off the supply, and you die.", // Apr 20
    "Think like a CEO. Act like a hustler. Live like a boss.",
    "Money flows to those who add value. Be valuable.",
    "Your time is limited. Your earning potential is not.",
    "Invest today. Retire tomorrow. Simple formula, massive results.",
    "The wealthy don't wait for opportunities. They create them.",
    "Your excuses are more expensive than your investments.",
    "Scale or fail. Growth is mandatory. Stagnation is death.",
    "Poverty is loud. Wealth is silent. Choose your volume.",
    "Every day you delay is wealth you'll never recover.",
    "April ends. Your bank account shouldn't.", // Apr 30

    // May (31 days)
    "May the cash flow be with you.",
    "Spring has sprung. So should your bank balance.",
    "Bloom where you're planted. Then monetize the garden.",
    "Your network determines your net worth. Build both.",
    "Invest in knowledge. Harvest in wealth.",
    "The best investment? Yourself. The best return? Infinite.",
    "Cash is king. Cash flow is emperor. Passive income is god.",
    "Your comfort zone is a financial prison. Escape now.",
    "Wealth whispers. Poverty screams. Listen to the quiet.",
    "Every dollar earned while sleeping is a step toward freedom.", // May 10
    "Broke is a temporary state. Poor is a permanent mindset.",
    "Your bank account reflects your habits. Change them.",
    "Think in decades. Act in days. Earn in millions.",
    "The market rewards speed. Move fast or get left behind.",
    "Leverage other people's time, money, and expertise.",
    "Revenue solves all problems. Focus on growth.",
    "Your skills are your currency. Develop them relentlessly.",
    "Invest now, retire early. Hesitate now, work forever.",
    "The grind doesn't stop until the money does. Keep going.",
    "Financial freedom is a choice, not a lottery.", // May 20
    "Your future self is judging you. Make them proud.",
    "Every hour not spent earning is an hour lost forever.",
    "Wealth is built on value. Create more, earn more.",
    "The marketplace pays for results, not effort.",
    "Your time is finite. Your income potential is infinite.",
    "Stop saving pennies. Start making millions.",
    "Automate your income. Multiply your time. Dominate.",
    "The wealthy don't trade time for money. They trade value for freedom.",
    "Opportunities are disguised as hard work. Find them.",
    "May ends. Your wealth shouldn't.", // May 30
    "Close the month stronger, richer, and hungrier.", // May 31

    // June (30 days)
    "June is for hustlers. Are you one?",
    "Summer is here. So should your money.",
    "The sun isn't the only thing heating up. Your bank account should too.",
    "Wealth doesn't take a vacation. Neither should you.",
    "Your competition is grinding. Are you?",
    "Invest in what compounds. Avoid what depreciates.",
    "Cash flow in June means freedom in December.",
    "The market rewards action. Take it now.",
    "Your network is your safety net. Build it strong.",
    "Every dollar saved is a soldier in your wealth army.", // Jun 10
    "Broke is temporary. Rich is a choice.",
    "Your mindset is your money magnet. Strengthen it.",
    "Think bigger. Earn faster. Live freer.",
    "The grind today is the freedom tomorrow.",
    "Leverage is the secret weapon of the wealthy.",
    "Revenue is vanity. Profit is sanity. Cash flow is reality.",
    "Your skills determine your income. Sharpen them daily.",
    "Invest today. Retire tomorrow. It's that simple.",
    "The wealthy create opportunities. The poor wait for them.",
    "Financial freedom isn't luck. It's discipline.", // Jun 20
    "Every second counts. Every dollar compounds.",
    "Your future is created today. Act accordingly.",
    "Wealth is built in silence. Poverty is celebrated with noise.",
    "Stop trading hours for dollars. Trade value for millions.",
    "The market doesn't care about your excuses. Neither should you.",
    "Your comfort zone is costing you millions. Leave it.",
    "Cash is oxygen for your business. Never let it run out.",
    "The best time to get rich was yesterday. The next best time is now.",
    "Opportunities bloom in June. Will you harvest?",
    "June ends. Your ambition doesn't.", // Jun 30

    // July (31 days)
    "Welcome to the second half. Time to double down.", // Jul 1
    "Fireworks fade. Fortunes don't. Build something lasting.",
    "Independence Day isn't just a holiday. It's a financial goal.",
    "The hottest months forge the strongest hustlers.",
    "Midyear check: Are you richer than January? You should be.",
    "Summer bodies are made in winter. Wealth is made in silence.",
    "While they vacation, you accumulate. That's the difference.",
    "Heat rises and so should your revenue.",
    "Half the year gone. Double your effort for the second half.",
    "July sun melts excuses. Let it melt yours.", // Jul 10
    "Sweat equity is the only equity that never crashes.",
    "Your Q3 goals should terrify your Q2 self.",
    "The scoreboard doesn't lie. Check your numbers.",
    "Every empire was built one brick at a time. Keep stacking.",
    "Millionaires are forged in July, announced in December.",
    "Don't cool off. The market never does.",
    "Momentum is everything. Lose it and you lose months.",
    "Your competitors took the summer off. Outwork them.",
    "Build your pipeline now. Thank yourself in November.",
    "The gap between you and wealth? Consistent daily action.", // Jul 20
    "Lazy summers create desperate winters. Stay hungry.",
    "Capital doesn't care about the calendar. Neither should you.",
    "Reinvest every win. Compound every gain.",
    "The best deals happen when everyone else is at the beach.",
    "Your future millionaire self started working this July.",
    "Discipline in July is dividends in December.",
    "Own the afternoon. Own the quarter. Own the year.",
    "Two kinds of people in July: those building and those burning out.",
    "The second half starts now. Make it count.",
    "Revenue doesn't take a summer break.", // Jul 30
    "July taught you to push. August will teach you to dominate.", // Jul 31

    // August (31 days)
    "August: where real hustlers separate from pretenders.", // Aug 1
    "Back to school for some. Back to the bag for you.",
    "The harvest is coming. Have you planted enough seeds?",
    "August heat tests commitment. Winners stay in the fire.",
    "Your bank account in December is decided by your August actions.",
    "Outwork the heat. Outwork the doubt. Outwork everyone.",
    "Late summer is when empires are quietly assembled.",
    "Every dollar you earn today works overtime tomorrow.",
    "August separates the builders from the dreamers.",
    "Your energy is currency. Spend it on things that appreciate.", // Aug 10
    "The market doesn't know what month it is. Stay relentless.",
    "Build in private. Launch in September. Dominate by December.",
    "Rich people rest strategically. Broke people rest chronically.",
    "Your August hustle is your October harvest.",
    "Stop planning to plan. Start executing to earn.",
    "Consistency beats intensity. Show up every single day.",
    "August is the runway. Q4 is the takeoff.",
    "Your income ceiling is set by your daily habits. Raise the roof.",
    "Operate like you're already a millionaire. The account will follow.",
    "Two-thirds of the year gone. One-third left to change everything.", // Aug 20
    "Money respects momentum. Don't you dare slow down.",
    "Every skill you learn is a new income stream waiting to open.",
    "The wealthy build assets in August. The broke build excuses.",
    "Your hustle should be louder than your alarm clock.",
    "Financial freedom has no off-season.",
    "Stack skills. Stack cash. Stack advantages.",
    "August: still time to make this your best year ever.",
    "Grind now so you can flex later. Not the other way around.",
    "The money doesn't care if it's hot outside. Get to work.",
    "Prepare in August. Execute in September. Celebrate in October.", // Aug 30
    "Summer's almost over. Your ambition is just getting started.", // Aug 31

    // September (30 days)
    "September is the real New Year. Set new financial goals.", // Sep 1
    "Fall is coming. Your income shouldn't.",
    "Q4 is 90 days away. Are your systems in place?",
    "Back to the grind. Actually, real ones never left.",
    "Leaves fall. Revenue rises. That's the goal.",
    "September discipline creates December dividends.",
    "The fourth quarter belongs to the prepared. Are you ready?",
    "Sharpen your tools now. Harvest season is here.",
    "Your September focus determines your year-end results.",
    "While they adjust to fall, you adjust your portfolio.", // Sep 10
    "The market shifts in September. Shift with it or get left.",
    "Knowledge acquired now compounds through Q4 and beyond.",
    "September: when strategic thinkers lap reactive ones.",
    "Your October self will thank your September hustle.",
    "Recession-proof your income. Diversify relentlessly.",
    "The last 100 days of the year start now. Make each one count.",
    "Fall forward into wealth. Never backward into comfort.",
    "Build your financial fortress before winter comes.",
    "Revenue goals aren't annual. They're daily habits.",
    "September separates the amateurs from the professionals.", // Sep 20
    "Ninety days to change your financial trajectory. Go.",
    "Your competition relaxed in summer. Crush them in fall.",
    "Every meeting in September is a deal in December.",
    "The successful don't wait for motivation. They create it.",
    "Stack your wins like autumn leaves. Deep and plentiful.",
    "Financial literacy is your sharpest weapon. Keep learning.",
    "Your systems should work harder than you do. Build them.",
    "The last quarter is the money quarter. Prepare accordingly.",
    "September hustle. October results. November gratitude. December wealth.",
    "Fall into money. Don't fall behind.", // Sep 30

    // October (31 days)
    "October: where Q4 warriors are born.", // Oct 1
    "The final sprint starts now. Leave nothing in the tank.",
    "Scary how much money you'll leave on the table if you stop now.",
    "Harvest what you planted. Reap what you sowed.",
    "October is for closers. Close deals, close gaps, close doubters.",
    "The wealthy plan in October what they execute in January.",
    "Your year-end bonus is the work you put in today.",
    "Seventy-five percent of the year is gone. Maximize the rest.",
    "October nights are for planning. October days are for executing.",
    "Fall back? Never. Fall forward into your next income stream.", // Oct 10
    "The market gets spooky. Disciplined investors get wealthy.",
    "Your financial future is written in the next 90 days.",
    "Compound your October gains. Watch them multiply.",
    "Every decision you make right now echoes into next year.",
    "October is not for resting. It's for stacking.",
    "The countdown to year-end starts. Make every day profitable.",
    "Trick-or-treat? How about recurring revenue and asset growth?",
    "Your ambition should scare you. If it doesn't, dream bigger.",
    "Build something this October that pays you every month after.",
    "The fourth quarter is the wealth quarter. Claim it.", // Oct 20
    "October hustle builds November momentum.",
    "Stack your income like pumpkins on a porch. Everywhere.",
    "Wealth isn't seasonal. Your effort shouldn't be either.",
    "The cold months are when the hardest workers emerge.",
    "Fifty days until Christmas. Your bank account should be ready.",
    "October: when smart money positions for the new year.",
    "Finish the month strong. Start November stronger.",
    "Your financial habits in October define your January reality.",
    "No shortcuts to wealth. Just consistent, relentless execution.",
    "The last 60 days of the year are the most profitable. Own them.", // Oct 30
    "October's over. Did you earn more than you spent? Good.", // Oct 31

    // November (30 days)
    "November: the month of gratitude and gaining.", // Nov 1
    "Be thankful for what you have. Then go get ten times more.",
    "Gratitude without ambition is complacency. Keep pushing.",
    "November is your final warning. December is the deadline.",
    "The deals made in November fund the dreams of January.",
    "Your year-end review starts now. What's the verdict?",
    "Thirty days to close out the year. Make them legendary.",
    "Thankful for the grind. Grateful for the gains.",
    "November rain grows December grain. Keep planting.",
    "While they shop Black Friday, you build Black Friday.", // Nov 10
    "Your Thanksgiving table should reflect your year's hustle.",
    "November is for harvesting. December is for celebrating.",
    "Count your blessings, but also count your revenue.",
    "The wealthy give thanks and then get back to building.",
    "Your November actions write your December paycheck.",
    "Consistency in November compounds into January wealth.",
    "Holiday season is revenue season. Capitalize on it.",
    "Your end-of-year push determines your start-of-year position.",
    "Every sale in November is a seed for next year's forest.",
    "Twenty days left. Twenty days to change your financial story.", // Nov 20
    "The holiday rush is your opportunity. Seize it.",
    "November teaches patience. December rewards persistence.",
    "Your portfolio should grow faster than your holiday wish list.",
    "Feast on opportunity. Fast on excuses.",
    "Finish November with momentum. Carry it into December.",
    "Black Friday for consumers. Building Friday for hustlers.",
    "The year isn't over until you say it is. Keep earning.",
    "November endings are December beginnings. Bridge the gap.",
    "Your income doesn't hibernate. Neither should you.",
    "November's done. December's your final stand. Make it count.", // Nov 30

    // December (31 days)
    "December: the final chapter. Write it in gold.", // Dec 1
    "Year-end is not a finish line. It's a launchpad.",
    "While they wind down, you double down.",
    "December is when champions are crowned. Are you one?",
    "Close every open loop. Collect every pending dollar.",
    "The last month defines the whole year. Make it legendary.",
    "Your December results are January's foundation. Build well.",
    "Holiday spirit is great. Holiday income is better.",
    "Twenty-three days to set up a dominant new year.",
    "December is for closing. Close the year with a record.", // Dec 10
    "Stack your wins before the clock runs out.",
    "The wealthy plan next year in December. The broke plan parties.",
    "Thirteen days left in the year. Thirteen reasons to go harder.",
    "Your annual review should make you proud. If not, fix it now.",
    "December 15: halftime of the final month. Pace yourself.",
    "Finish what you started. Start what you'll finish.",
    "The gift of compound interest keeps giving all year round.",
    "Your New Year's resolution should be 'earn more, waste less.'",
    "December 19: eleven days to outperform your past self.",
    "Year-end tax moves separate the wealthy from the wishful.", // Dec 20
    "Winter solstice: the darkest day. Let your ambition be the light.",
    "Stack those year-end bonuses. Reinvest immediately.",
    "Your bank account on December 23 reflects 357 days of effort.",
    "Christmas Eve: the gift of financial freedom is self-given.",
    "Merry Christmas. Now back to building the empire.",
    "Boxing Day: box up your excuses. Ship them away forever.",
    "Five days left. Five days to cement your legacy this year.",
    "Reflect on the wins. Learn from the losses. Plan the comeback.",
    "Two days left. Every hour counts. Every dollar matters.",
    "New Year's Eve eve: tomorrow you celebrate. Today you execute.", // Dec 30
    "Last day. Did you leave it all on the field? Good. Now rest. Tomorrow we go again." // Dec 31
  ];

  // ===== 27 Rotating GIF URLs (Money/Success Theme) =====
  const ROTATING_GIFS = [
    'https://media.giphy.com/media/67ThRZlYBvibtdF9JH/giphy.gif', // Money rain
    'https://media.giphy.com/media/l0HlPystfePnAI3G8/giphy.gif', // Cash stack
    'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif', // Wolf of Wall Street
    'https://media.giphy.com/media/LdOyjZ7io5Msw/giphy.gif', // Make it rain
    'https://media.giphy.com/media/ND6xkVPaj8tHO/giphy.gif', // Scrooge McDuck money
    'https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif', // Money counting
    'https://media.giphy.com/media/xT0GqH01ZyKwd3aT3G/giphy.gif', // Success celebration
    'https://media.giphy.com/media/3o6Zt6KHxJTbXCnSvu/giphy.gif', // Cash machine
    'https://media.giphy.com/media/l0MYGb1LuZ3n7dRnO/giphy.gif', // Money phone
    'https://media.giphy.com/media/l3vQYEJeHm4Hm0i9q/giphy.gif', // Wealthy lifestyle
    'https://media.giphy.com/media/xT1XGU1AHz9Fe8tmp2/giphy.gif', // Stacks on stacks
    'https://media.giphy.com/media/3o7TKnO6Wve6502iJ2/giphy.gif', // Gold coins
    'https://media.giphy.com/media/l0HlQ7LRalQqdWfao/giphy.gif', // Rich duck
    'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif', // Money falling
    'https://media.giphy.com/media/3o7TKz5Zy7zHGFEXCw/giphy.gif', // Success dance
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', // Cash register
    'https://media.giphy.com/media/xT0xeznQtzuSTdE5IA/giphy.gif', // Money bag
    'https://media.giphy.com/media/l0HlHJGHe3yAMhdQY/giphy.gif', // Billionaire vibes
    'https://media.giphy.com/media/3o6ZsZedY1zLKmXV8A/giphy.gif', // Hustler mentality
    'https://media.giphy.com/media/xT0xeMA62E1XIlup68/giphy.gif', // Money shower
    'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif', // Wealth accumulation
    'https://media.giphy.com/media/3o7TKCCjxGwGcx1qve/giphy.gif', // Success vibes
    'https://media.giphy.com/media/xT0xeMrCEGPiU5uw0w/giphy.gif', // Money printer
    'https://media.giphy.com/media/l0HlQPc3J3dLNaGBO/giphy.gif', // Cash flow
    'https://media.giphy.com/media/3o6Zt0hNCfak3QCqsw/giphy.gif', // Rich lifestyle
    'https://media.giphy.com/media/xT0xeJphMJe0pxKPgA/giphy.gif', // Money motivation
    'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif' // Empire building
  ];

  // ===== Quote System Class =====
  class DailyQuoteSystem {
    constructor() {
      this.quotes = DAILY_QUOTES;
      this.gifs = ROTATING_GIFS;
      this.storageKey = 'admension_daily_quote_viewed';
      
      this.init();
    }

    init() {
      console.log('[Daily Quotes] System initialized');
      this.displayTodaysQuote();
    }

    // Get day of year (1-365)
    getDayOfYear() {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now - start;
      const oneDay = 1000 * 60 * 60 * 24;
      return Math.floor(diff / oneDay);
    }

    // Get today's quote (deterministic based on day of year)
    getTodaysQuote() {
      const dayOfYear = this.getDayOfYear();
      const quoteIndex = (dayOfYear - 1) % this.quotes.length; // 0-364
      return this.quotes[quoteIndex];
    }

    // Get random GIF for today (changes daily but consistent per day)
    getTodaysGif() {
      const dayOfYear = this.getDayOfYear();
      const gifIndex = dayOfYear % this.gifs.length; // Rotates through 27 GIFs
      return this.gifs[gifIndex];
    }

    // Display quote on homepage
    displayTodaysQuote() {
      const container = document.getElementById('dailyQuoteContainer');
      if (!container) {
        console.warn('[Daily Quotes] Container #dailyQuoteContainer not found');
        return;
      }

      const quote = this.getTodaysQuote();
      const gifUrl = this.getTodaysGif();
      const dayOfYear = this.getDayOfYear();

      // Build HTML
      container.innerHTML = `
        <div class="daily-quote-card" style="
          position: relative;
          background: linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(12,12,16,0.95) 100%),
                      url('${gifUrl}') center/cover;
          border: 2px solid rgba(255,215,0,0.4);
          border-radius: 16px;
          padding: 32px;
          margin: 16px 0;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          box-shadow: 0 10px 40px rgba(255,215,0,0.2);
          overflow: hidden;
        ">
          <div class="quote-badge" style="
            position: absolute;
            top: 16px;
            right: 16px;
            background: rgba(255,215,0,0.9);
            color: #000;
            padding: 6px 12px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 12px;
            letter-spacing: 0.5px;
          ">
            DAY ${dayOfYear}/365
          </div>
          
          <div class="quote-icon" style="
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.9;
          ">💰</div>
          
          <blockquote class="quote-text" style="
            font-size: 22px;
            font-weight: 700;
            line-height: 1.5;
            color: #fff;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
            max-width: 800px;
            margin: 0;
            padding: 0 20px;
            position: relative;
            z-index: 1;
          ">
            "${quote}"
          </blockquote>
          
          <div class="quote-attribution" style="
            margin-top: 16px;
            font-size: 14px;
            color: rgba(255,215,0,0.8);
            font-weight: 600;
            letter-spacing: 1px;
          ">
            — ADMENSION DAILY MOTIVATION
          </div>
        </div>
      `;

      // Track view
      this.trackView(dayOfYear);
    }

    trackView(dayOfYear) {
      try {
        const viewed = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        viewed[dayOfYear] = Date.now();
        localStorage.setItem(this.storageKey, JSON.stringify(viewed));
      } catch(e) {
        console.warn('[Daily Quotes] Failed to track view:', e);
      }
    }

    // Get stats (for admin dashboard)
    getStats() {
      try {
        const viewed = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        return {
          totalDaysViewed: Object.keys(viewed).length,
          currentStreak: this.calculateStreak(viewed),
          lastViewed: Math.max(...Object.values(viewed))
        };
      } catch(e) {
        return { totalDaysViewed: 0, currentStreak: 0, lastViewed: 0 };
      }
    }

    calculateStreak(viewed) {
      const today = this.getDayOfYear();
      let streak = 0;
      
      for (let i = today; i > 0; i--) {
        if (viewed[i]) {
          streak++;
        } else {
          break;
        }
      }
      
      return streak;
    }
  }

  // ===== Initialize Global Instance =====
  if (!window.ADMENSION_DAILY_QUOTES) {
    window.ADMENSION_DAILY_QUOTES = new DailyQuoteSystem();
    console.log('[Daily Quotes] Day', window.ADMENSION_DAILY_QUOTES.getDayOfYear(), 'quote loaded');
  }

})();
