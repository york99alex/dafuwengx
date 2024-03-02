import { TP_RUNE } from '../../constants/gamemessage';
import { Player } from '../../player/player';
import { AMHC } from '../../utils/amhc';
import { Path } from '../Path';

/**神符路径 */
export class PathRune extends Path {
    /**神符生产实体 */
    m_eSpawn: CBaseEntity;
    /**神符实体 */
    m_eRune: CBaseEntity;
    /**神符粒子特效ID */
    m_nPtclID: ParticleID;
    /**更换神符回合 */
    m_nUpdateRound: number;
    /**神符类型 */
    m_typeRune: RuneType;
    /**上次类型 */
    m_typeRuneLast: RuneType;

    constructor(entity: CBaseEntity) {
        super(entity);
        this.m_eSpawn = Entities.FindByClassnameNearest('dota_item_rune_spawner', this.m_entity.GetOrigin(), 50);
        if (this.m_eSpawn == null) {
            error('===PathRune constructor(): not find dota_item_rune_spawner!!!');
        }

        const tabPath = GameRules.PathManager.getPathByType(TP_RUNE) as PathRune[];
        if (tabPath.length == 0 || tabPath[0].m_typeRuneLast != RuneType.BOUNTY) {
            this.m_typeRuneLast = RuneType.BOUNTY;
        } else {
            this.m_typeRuneLast = RuneType.INVALID;
        }

        // 监听游戏回合更新：每两回合刷符
        GameRules.EventManager.Register('Event_GameStart', () => {
            this.spawnRune();
            return true;
        });
        GameRules.EventManager.Register('Event_UpdateRound', (event: { isBegin: boolean; nRound: number }) => this.onEvent_UpdateRound(event), this);
    }

    /**触发路径 */
    onPath(player: Player): void {
        super.onPath(player);

        if (!this.m_eRune) return;

        // 玩家激活神符
        this.onRune(player, this.m_typeRune);
        this.destoryRune();
        Timers.CreateTimer(2, () => this.spawnRune());
    }

    /**玩家激活神符 */
    onRune(player: Player, typeRune: RuneType) {
        if (!RUNE_SETTINGS[typeRune]) return;
        EmitGlobalSound(RUNE_SETTINGS[typeRune].sound);
        // TODO:设置游戏记录
        // GameRecord.setGameRecord

        // 隐身时在攻击状态中断
        if (typeRune == RuneType.INVISIBILITY) {
            player.moveStop();
            GameRules.EventManager.FireEvent('Event_ActionStop', {
                entity: player.m_eHero,
                bMoveBack: true,
            });
        }
        // 设置神符效果技能
        AMHC.AddAbilityAndSetLevel(player.m_eHero, 'rune_' + typeRune, 1);
    }

    /**刷新神符 */
    spawnRune() {
        // 销毁当前神符
        if (this.m_eRune != null) this.destoryRune();

        if (this.m_typeRuneLast == RuneType.BOUNTY) {
            // 上次是赏金这次不是
            do {
                this.m_typeRune = RandomInt(RuneType.INVALID + 1, DOTA_RUNE_COUNT);
            } while (this.m_typeRune != RuneType.BOUNTY && !RUNE_SETTINGS[this.m_typeRune]);
        } else {
            this.m_typeRune = RuneType.BOUNTY;
        }
        // this.m_typeRune = RuneType.SHIELD;
        this.m_eRune = this.createRune(this.m_eSpawn.GetAbsOrigin(), this.m_typeRune);

        // 俩回合更换
        this.m_nUpdateRound = GameRules.GameConfig.m_nRound + 2;
    }

    createRune(location: Vector, runeType: RuneType) {
        const settings = RUNE_SETTINGS[runeType];
        const entity = CreateUnitByName('rune_' + runeType, location, false, null, null, DotaTeam.GOODGUYS);
        this.m_typeRune = runeType;
        entity.m_bRune = true;
        entity.m_path = this;
        entity.SetModel(settings.model);
        entity.SetOriginalModel(settings.model);
        this.m_nPtclID = ParticleManager.CreateParticle(settings.particle, ParticleAttachment.ABSORIGIN_FOLLOW, entity);
        entity.StartGesture(GameActivity.IDLE);
        return entity;
    }

    /**销毁神符 */
    destoryRune() {
        this.m_typeRuneLast = this.m_typeRune;

        if (this.m_nPtclID) ParticleManager.DestroyParticle(this.m_nPtclID, false);
        this.m_nPtclID = null;

        this.m_eRune.RemoveSelf();
        this.m_eRune = null;
    }

    /**游戏回合更新，更新神符 */
    onEvent_UpdateRound(event: { isBegin: boolean; nRound: number }) {
        if (this.m_nUpdateRound && this.m_nUpdateRound <= GameRules.GameConfig.m_nRound) {
            this.spawnRune();
        }
    }
}

/**神符信息 */
const RuneNum = [
    RuneType.DOUBLEDAMAGE,
    RuneType.HASTE,
    RuneType.INVISIBILITY,
    RuneType.REGENERATION,
    RuneType.BOUNTY,
    RuneType.ARCANE,
    RuneType.XP,
    RuneType.SHIELD,
];
const RUNE_SETTINGS: { [key: number]: { model: string; particle: string; sound: string } } = {
    // 双倍
    [RuneType.DOUBLEDAMAGE]: {
        model: 'models/props_gameplay/rune_doubledamage01.vmdl',
        particle: 'particles/generic_gameplay/rune_doubledamage.vpcf',
        sound: 'Rune.DD',
    },
    // 极速
    [RuneType.HASTE]: {
        model: 'models/props_gameplay/rune_haste01.vmdl',
        particle: 'particles/generic_gameplay/rune_haste.vpcf',
        sound: 'Rune.Haste',
    },
    // 隐身
    [RuneType.INVISIBILITY]: {
        model: 'models/props_gameplay/rune_invisibility01.vmdl',
        particle: 'particles/generic_gameplay/rune_invisibility.vpcf',
        sound: 'Rune.Invis',
    },
    // 回复
    [RuneType.REGENERATION]: {
        model: 'models/props_gameplay/rune_regeneration01.vmdl',
        particle: 'particles/generic_gameplay/rune_regeneration.vpcf',
        sound: 'Rune.Regen',
    },
    // 赏金
    [RuneType.BOUNTY]: {
        model: 'models/props_gameplay/rune_goldxp.vmdl',
        particle: 'particles/generic_gameplay/rune_bounty.vpcf',
        sound: 'Rune.Bounty',
    },
    // 奥数
    [RuneType.ARCANE]: {
        model: 'models/props_gameplay/rune_arcane.vmdl',
        particle: 'particles/generic_gameplay/rune_arcane.vpcf',
        sound: 'Rune.Arcane',
    },
    // 经验/智慧
    [RuneType.XP]: {
        model: 'models/props_gameplay/rune_xp.vmdl',
        particle: 'particles/generic_gameplay/rune_wisdom.vpcf',
        sound: 'Rune.XP',
    },
    // 护盾
    [RuneType.SHIELD]: {
        model: 'models/props_gameplay/rune_shield01.vmdl',
        particle: 'particles/generic_gameplay/rune_shield.vpcf',
        sound: 'Rune.Shield',
    },
};
