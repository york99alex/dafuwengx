/** @noSelfInFile */
// 导出的预载入方法，用来给addon_game_mode.ts调用
export default function Precache(context: CScriptPrecacheContext) {
    // 需要预载的所有资源
    precacheResource(
        [
            // '***.vpcf',
            // 'soundevents/game_sounds_heroes/game_sounds_queenofpain.vsndevts',
            // '***.vmdl',
            'particles/units/heroes/hero_phantom_assassin/phantom_assassin_loadout.vpcf',
            'particles/generic_hero_status/hero_levelup.vpcf',
            'particles/units/heroes/hero_meepo/meepo_poof_start.vpcf',
            'particles/units/heroes/hero_meepo/meepo_loadout.vpcf',
            'particles/econ/items/pudge/pudge_trapper_beam_chain/pudge_nx_meathook.vpcf',
            'particles/units/heroes/hero_pudge/pudge_rot.vpcf',
            'particles/units/heroes/hero_lina/lina_spell_dragon_slave.vpcf',
            'particles/units/heroes/hero_dark_willow/dark_willow_wisp_spell_marker_ring.vpcf',
            'particles/units/heroes/hero_lina/lina_spell_light_strike_array.vpcf',
            'particles/generic_gameplay/generic_stunned.vpcf',
            'particles/units/heroes/hero_zuus/zuus_arc_lightning_head.vpcf',
            'particles/units/heroes/hero_zuus/zuus_thundergods_wrath.vpcf',
            'particles/econ/items/zeus/lightning_weapon_fx/zuus_lb_cfx_il.vpcf',
            'particles/units/heroes/hero_axe/axe_battle_hunger.vpcf',
            'soundevents/custom_sounds.vsndevts',
            'particles/units/heroes/hero_legion_commander/legion_commander_duel_victory.vpcf',
            'particles/econ/items/windrunner/windrunner_ti6/windrunner_spell_powershot_ti6_arc_b.vpcf',
            'particles/econ/items/shadow_shaman/shadow_shaman_ti8/shadow_shaman_ti8_ether_shock_target_snakes.vpcf',
            'particles/custom/path_ablt/path_ablt_nocdmana_1.vpcf',
            'particles/custom/path_ablt/path_ablt_nocdmana_2.vpcf',
            'particles/custom/path_ablt/path_ablt_nocdmana_21.vpcf',
            'particles/custom/path_ablt/path_ablt_nocdmana_3.vpcf',
            'particles/custom/path_ablt/path_ablt_nocdmana_31.vpcf',
            
        ],
        context
    );
    // 需要预载入的kv文件，会自动解析KV文件中的所有vpcf资源等等
    precacheEveryResourceInKV(
        [
            // kv文件路径
            // 'npc_abilities_custom.txt',
        ],
        context
    );
    // 需要预载入的单位
    precacheUnits(
        [
            // 单位名称
            // 'npc_dota_hero_***',
        ],
        context
    );
    // 需要预载入的物品
    precacheItems(
        [
            // 物品名称
            // 'item_***',
        ],
        context
    );
    print(`[Precache] Precache finished.`);
}

// 预载入KV文件中的所有资源
function precacheEveryResourceInKV(kvFileList: string[], context: CScriptPrecacheContext) {
    kvFileList.forEach(file => {
        const kvTable = LoadKeyValues(file);
        precacheEverythingFromTable(kvTable, context);
    });
}
// 预载入资源列表
function precacheResource(resourceList: string[], context: CScriptPrecacheContext) {
    resourceList.forEach(resource => {
        precacheResString(resource, context);
    });
}
function precacheResString(res: string, context: CScriptPrecacheContext) {
    if (res.endsWith('.vpcf')) {
        PrecacheResource('particle', res, context);
    } else if (res.endsWith('.vsndevts')) {
        PrecacheResource('soundfile', res, context);
    } else if (res.endsWith('.vmdl')) {
        PrecacheResource('model', res, context);
    }
}

// 预载入单位列表
function precacheUnits(unitNamesList: string[], context?: CScriptPrecacheContext) {
    if (context != null) {
        unitNamesList.forEach(unitName => {
            PrecacheUnitByNameSync(unitName, context);
        });
    } else {
        unitNamesList.forEach(unitName => {
            PrecacheUnitByNameAsync(unitName, () => { });
        });
    }
}
// 预载入物品列表
function precacheItems(itemList: string[], context: CScriptPrecacheContext) {
    itemList.forEach(itemName => {
        PrecacheItemByNameSync(itemName, context);
    });
}

// 一个辅助的，从KV表中解析出所有资源并预载入的方法
function precacheEverythingFromTable(kvTable: any, context: CScriptPrecacheContext) {
    for (const [k, v] of pairs(kvTable)) {
        if (type(v) === 'table') {
            precacheEverythingFromTable(v, context);
        } else if (type(v) === 'string') {
            precacheResString(v, context);
        }
    }
}
