import 'utils/index';
import { ActivateModules } from './modules';
import Precache from './utils/precache';

Object.assign(getfenv(), {
    Activate: () => {
        ActivateModules();
        LinkModifers();
    },
    Precache: Precache,
});

function LinkModifers() {
    LinkLuaModifier("modifier_primary_attribute", "modifiers/hero/modifier_primary_attribute.lua", LuaModifierMotionType.NONE)

    LinkLuaModifier("modifier_strength", "modifiers/hero/modifier_strength.lua", LuaModifierMotionType.NONE)
    LinkLuaModifier("modifier_agility", "modifiers/hero/modifier_agility.lua", LuaModifierMotionType.NONE)
    LinkLuaModifier("modifier_intellect", "modifiers/hero/modifier_intellect.lua", LuaModifierMotionType.NONE)
    LinkLuaModifier("modifier_all", "modifiers/hero/modifier_all.lua", LuaModifierMotionType.NONE)

    LinkLuaModifier("modifier_base_strength", "modifiers/hero/modifier_base_strength.lua", LuaModifierMotionType.NONE)
    LinkLuaModifier("modifier_base_agility", "modifiers/hero/modifier_base_agility.lua", LuaModifierMotionType.NONE)
    LinkLuaModifier("modifier_base_intellect", "modifiers/hero/modifier_base_intellect.lua", LuaModifierMotionType.NONE)

}
