package com.tessera.backend.util;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import name.fraser.neil.plaintext.diff_match_patch;
import name.fraser.neil.plaintext.diff_match_patch.Diff;

@Component
public class DiffUtils {
    
    private final diff_match_patch dmp = new diff_match_patch();
    
    /**
     * Gera um diff entre dois textos
     */
    public String generateDiff(String oldText, String newText) {
        List<Diff> diffs = dmp.diff_main(oldText, newText);
        dmp.diff_cleanupSemantic(diffs);
        
        return dmp.diff_toDelta(diffs);
    }
    
    /**
     * Aplica um diff a um texto
     */
    public String applyDiff(String text, String diffDelta) {
        List<Diff> diffs = dmp.diff_fromDelta(text, diffDelta);
        
        List<diff_match_patch.Patch> patches = dmp.patch_make(text, diffs);
        Object[] result = dmp.patch_apply((ArrayList<diff_match_patch.Patch>) patches, text);
        
        return (String) result[0];
    }
    
    /**
     * Renderiza um diff como HTML com <ins> e <del>
     */
    public String renderDiffHtml(String oldText, String newText) {
        List<Diff> diffs = dmp.diff_main(oldText, newText);
        dmp.diff_cleanupSemantic(diffs);
        
        return dmp.diff_prettyHtml(diffs);
    }
}