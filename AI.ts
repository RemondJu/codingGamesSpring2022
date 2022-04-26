class Entity {
  TYPE_MONSTER = 0;
  TYPE_MY_HERO = 1;
  TYPE_OTHER_HERO = 2;
  MY_BASE = 1;
  OTHER_BASE = 2;
  distanceFromMyBase: number;
  constructor(
    public id: number,
    public type: number,
    public x: number,
    public y: number,
    public shieldLife: number,
    public isControlled: number,
    public health: number,
    public vx: number,
    public vy: number,
    public nearBase: number,
    public threatFor: number,
    private me: Player
  ) {
    this.distanceFromMyBase = this.getDistanceFrom(
      this.me.basePosX,
      this.me.basePosY
    );
  }
  isDangerousForMyBase = (): boolean => {
    return this.threatFor === this.MY_BASE;
  };
  isDangerousForEnnemyBase = (): boolean => {
    return this.threatFor === this.OTHER_BASE;
  };
  getDistanceFrom = (x: number, y: number): number => {
    return Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2));
  };
}

class Player {
  constructor(
    public basePosX: number,
    public basePosY: number,
    public baseHealth: number,
    public mana: number
  ) {}
  setHealth = (value: number) => {
    this.baseHealth = value;
  };
  setMana = (value: number) => {
    this.mana = value;
  };
  canCast = (): boolean => {
    return this.mana >= 10;
  };
}

class Game {
  ACTION_WAIT = "WAIT";
  ACTION_MOVE = "MOVE";
  ACTION_SPELL = "SPELL";
  SPELL_WIND = "WIND";
  SPELL_CONTROL = "CONTROL";
  SPELL_SHIELD = "SHIELD";

  me: Player;
  enemy: Player;
  entities: Entity[];

  constructor(baseX: number, baseY: number, private heroes: number) {
    this.me = new Player(baseX, baseY, 3, 0);
    this.enemy = new Player(
      baseX === 0 ? 17630 : 0,
      baseY === 0 ? 9000 : 0,
      3,
      0
    );
  }

  newTurn = (
    health: number,
    mana: number,
    enemyHealth: number,
    enemyMana: number
  ) => {
    this.me.setHealth(health);
    this.me.setMana(mana);
    this.enemy.setHealth(enemyHealth);
    this.enemy.setMana(enemyMana);
    this.entities = [];
  };

  addEntity = (entity: Entity) => {
    this.entities.push(entity);
  };

  moveTo = (hero: number, x: number, y: number): string => {
    return `${this.ACTION_MOVE} ${x} ${y}`

  };

  wait = (): string => {
    return this.ACTION_WAIT;
  };

  castWindSpell = (x: number, y: number): string => {
    return `${this.ACTION_SPELL} ${this.SPELL_WIND} ${x} ${y} HADOUKEN!`;
  }

  castShieldSpell = (id: number): string => {
    return `${this.ACTION_SPELL} ${this.SPELL_SHIELD} ${id}`;
  }

  castControlSpell = (id: number, x: number, y: number): string => {
    return `${this.ACTION_SPELL} ${this.SPELL_CONTROL} ${id} ${x} ${y}`;
  }

  debug = (message: string, ...rest) => {
    console.error(message, ...rest);
  };
}

const [baseX, baseY] = readline().split(" ").map(Number); // The corner of the map representing your base
const heroesPerPlayer: number = Number(readline()); // Always 3
const game = new Game(baseX, baseY, heroesPerPlayer);

// game loop
while (true) {
  const myBaseInput: number[] = readline().split(" ").map(Number);
  const enemyBaseInput: number[] = readline().split(" ").map(Number);
  game.newTurn(
    myBaseInput[0],
    myBaseInput[1],
    enemyBaseInput[0],
    enemyBaseInput[1]
  );

  const entityCount: number = Number(readline()); // Amount of heros and monsters you can see
  for (let i = 0; i < entityCount; i++) {
    const inputs: number[] = readline().split(" ").map(Number);
    game.addEntity(
      new Entity(
        inputs[0], // Unique identifier
        inputs[1], // 0=monster, 1=your hero, 2=opponent hero
        inputs[2], // Position of this entity
        inputs[3],
        inputs[4], // Ignore for this league; Count down until shield spell fades
        inputs[5], // Ignore for this league; Equals 1 when this entity is under a control spell
        inputs[6], // Remaining health of this monster
        inputs[7], // Trajectory of this monster
        inputs[8],
        inputs[9], // 0=monster with no target yet, 1=monster targeting a base
        inputs[10], // Given this monster's trajectory, is it a threat to 1=your base, 2=your opponent's base, 0=neither
        game.me
      )
    );
  }
  const startingPositions = [
    { x: game.me.basePosX > 0 ? 12700 : 4800, y: game.me.basePosY > 0 ? 4900 : 4000},
    { x: game.me.basePosX > 0 ? 11100 : 6200, y: game.me.basePosY > 0 ? 7400 : 1300},
    { x: game.me.basePosX > 0 ? 15750 : 1750, y: game.me.basePosY > 0 ? 3150 : 6000}
  ];
  let heroesSpacing: number = -250;
  let myHeroes = game.entities.filter(entity => entity.type === entity.TYPE_MY_HERO).sort((a, b) => a.id - b.id);
  let allMonsters = game.entities.filter(entity => entity.type === entity.TYPE_MONSTER);
  let hasCastWindSpell: boolean = false;
  let hasCastControlSpell: boolean = false;
  let hasCastShieldSpell: boolean = false;
  let monstersByDanger = game.entities.filter(entity => entity.type === entity.TYPE_MONSTER && entity.isDangerousForMyBase() && entity.distanceFromMyBase < 10000).sort((a, b) => a.distanceFromMyBase - b.distanceFromMyBase);
  myHeroes.forEach((hero, i) => {
    let closestMonstersFromHero = allMonsters.length ? allMonsters.sort((a, b) => a.getDistanceFrom(hero.x, hero.y) - b.getDistanceFrom(hero.x, hero.y)) : [];
    let closestNeutralMonsters = closestMonstersFromHero.filter(monster => !monster.isControlled);
    // Behavior when dangerous monsters are spotted
    if (monstersByDanger.length) {
      if (monstersByDanger[0].distanceFromMyBase < 5000 && monstersByDanger[0].isDangerousForMyBase) {
        let closestHero = myHeroes.sort((a, b) => a.getDistanceFrom(monstersByDanger[0].x, monstersByDanger[0].y) - b.getDistanceFrom(monstersByDanger[0].x, monstersByDanger[0].y))[0];
        if (game.me.canCast() && closestHero.getDistanceFrom(monstersByDanger[0].x, monstersByDanger[0].y) < 1280 && !hasCastWindSpell && hero.id === closestHero.id) {
          console.log(game.castWindSpell(game.enemy.basePosX, game.enemy.basePosY));
          hasCastWindSpell = true;
        } else {
          // Sending all heroes on really close to base monster
          console.log(game.moveTo(i, monstersByDanger[0].x + heroesSpacing, monstersByDanger[0].y + heroesSpacing));
        }
        heroesSpacing += 250;
      } else if (monstersByDanger.length < 3) {
        // Sending hero to first monster in sight or move to starting postion till monster gets in sight
        if (closestMonstersFromHero.length && hero.getDistanceFrom(startingPositions[i].x, startingPositions[i].y) < 2200 && closestMonstersFromHero[0].getDistanceFrom(hero.x, hero.y) < 2000) {
          if (game.me.canCast() && !hasCastControlSpell && !closestMonstersFromHero[0].isControlled) {
            console.log(game.castControlSpell(closestMonstersFromHero[0].id, game.enemy.basePosX, game.enemy.basePosY));
            hasCastControlSpell = true;
          } else {
            if (closestNeutralMonsters.length) {
              console.log(game.moveTo(i, closestNeutralMonsters[0].x, closestNeutralMonsters[0].y));
            } else {
              console.log(game.moveTo(i, startingPositions[i].x, startingPositions[i].y));
            }
          }
        } else {
          console.log(game.moveTo(i, startingPositions[i].x, startingPositions[i].y));
        }
      } else {
        // Sending each hero on the three closest dangerous monsters in sight
        console.log(game.moveTo(i, monstersByDanger[i].x, monstersByDanger[i].y));
      }
    // Behavior when no dangerous monsters are spotted, but some are close to heroes
    } else if (closestMonstersFromHero.length) {
      if (closestMonstersFromHero.length && hero.getDistanceFrom(startingPositions[i].x, startingPositions[i].y) < 3000 && closestMonstersFromHero[0].getDistanceFrom(hero.x, hero.y) < 2200) {
        if (game.me.canCast()) {
          // casting control on close monsters that are no threat for the ennemy
          if (!hasCastControlSpell && !closestMonstersFromHero[0].isDangerousForEnnemyBase) {
            console.log(game.castControlSpell(closestMonstersFromHero[0].id, game.enemy.basePosX, game.enemy.basePosY));
            hasCastControlSpell = true;
          // Casting shield on controlled monsters
          } else if (closestMonstersFromHero[0].isDangerousForEnnemyBase && closestMonstersFromHero[0].isControlled && !hasCastShieldSpell) {
            console.log(game.castShieldSpell(closestMonstersFromHero[0].id));
            hasCastShieldSpell = true;
          // Chasing closest uncontrolled monster or returning to starting position
          } else {
            if (closestNeutralMonsters.length) {
              console.log(game.moveTo(i, closestNeutralMonsters[0].x, closestNeutralMonsters[0].y));
            } else {
              console.log(game.moveTo(i, startingPositions[i].x, startingPositions[i].y));
            }
          }
        } else {
          if (closestNeutralMonsters.length) {
            console.log(game.moveTo(i, closestNeutralMonsters[0].x, closestNeutralMonsters[0].y));
          } else {
            console.log(game.moveTo(i, startingPositions[i].x, startingPositions[i].y));
          }
        }
      } else {
        // Returning heroes to strategic starting positions
        console.log(game.moveTo(i, startingPositions[i].x, startingPositions[i].y));
      }
    } else {
      // Dispatching heroes to strategic starting positions
      console.log(game.moveTo(i, startingPositions[i].x, startingPositions[i].y));
    }
  })
}