package com.tessera.backend.util;

import java.util.LinkedList;

import org.springframework.stereotype.Component;

import org.bitbucket.cowwoc.diffmatchpatch.DiffMatchPatch;
import org.bitbucket.cowwoc.diffmatchpatch.DiffMatchPatch.Diff;
import org.bitbucket.cowwoc.diffmatchpatch.DiffMatchPatch.Patch;

@Component
public class DiffUtils {
    
    private final DiffMatchPatch dmp = new DiffMatchPatch();
    
    /**
     * Gera um diff entre dois textos
     */
    public String generateDiff(String oldText, String newText) {
        LinkedList<Diff> diffs = (LinkedList<Diff>) dmp.diffMain(oldText, newText);
        dmp.diffCleanupSemantic(diffs);
        
        return dmp.diffToDelta(diffs);
    }
    
    /**
     * Aplica um diff a um texto
     */
    public String applyDiff(String text, String diffDelta) {
        LinkedList<Diff> diffs = (LinkedList<Diff>) dmp.diffFromDelta(text, diffDelta);
        
        LinkedList<Patch> patches = dmp.patchMake(text, diffs);
        Object[] result = dmp.patchApply(patches, text);
        
        return (String) result[0];
    }
    
    /**
     * Renderiza um diff como HTML com <ins> e <del>
     */
    public String renderDiffHtml(String oldText, String newText) {
        LinkedList<Diff> diffs = (LinkedList<Diff>) dmp.diffMain(oldText, newText);
        dmp.diffCleanupSemantic(diffs);
        
        return dmp.diffPrettyHtml(diffs);
    }
}