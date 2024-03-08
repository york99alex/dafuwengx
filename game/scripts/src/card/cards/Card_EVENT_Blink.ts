import { TP_START } from '../../constants/gamemessage';
import { CameraManage } from '../../mode/S2Cmode/CameraManage';
import { Path } from '../../path/Path';
import { AMHC } from '../../utils/amhc';
import { Card } from '../card';

/**事件闪烁匕首 30005 */
export class Card_EVENT_Blink extends Card {
    m_sName: string='闪烁匕首';
    OnSpellStart(): void {
        let target: Path;
        if (RandomInt(1, 2) == 1) {
            const noOwnerPaths = GameRules.PathManager.getNoOwnerPaths();
            print('===noOwnerPaths length:', noOwnerPaths.length);
            noOwnerPaths.forEach(path => print('pathID:',path.m_nID))
            if (noOwnerPaths != null && noOwnerPaths.length > 0) target = noOwnerPaths[RandomInt(0, noOwnerPaths.length - 1)];
        }
        if (!target) target = GameRules.PathManager.getPathByType(TP_START)[0];

        const player = this.GetOwner();
        if (!player) return;

        // 特效
        let nPtclID = AMHC.CreateParticle('particles/items_fx/blink_dagger_start.vpcf', ParticleAttachment.ABSORIGIN, false, player.m_eHero, 2);
        ParticleManager.SetParticleControl(nPtclID, 0, player.m_eHero.GetAbsOrigin());

        // 音效
        EmitGlobalSound('DOTA_Item.BlinkDagger.Activate');

        // 闪现到路径
        player.blinkToPath(target);
        // 判断路径触发功能
        player.m_pathCur.onPath(player);

        nPtclID = AMHC.CreateParticle('particles/items_fx/blink_dagger_end.vpcf', ParticleAttachment.ABSORIGIN, false, player.m_eHero, 2);
        ParticleManager.SetParticleControl(nPtclID, 0, player.m_eHero.GetAbsOrigin());

        // 视角
        CameraManage.LookAt(player.m_nPlayerID, player.m_eHero.GetAbsOrigin(), 0.1);
    }
}
