import { Path } from '../path/Path';

declare global {
    interface CDOTA_BaseNPC {
        /**兵卒所在路径或玩家所在路径 */
        m_path?: any;
    }
}
