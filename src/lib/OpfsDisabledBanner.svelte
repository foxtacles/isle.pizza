<script>
    import { opfsDisabled } from '../stores.js';
</script>

{#if $opfsDisabled}
    <blockquote class="error-box">
        <p>OPFS is disabled in this browser. This feature is unavailable. If you are using a
            Private/Incognito window, please change to a regular window instead.</p>
    </blockquote>
{/if}
