<script>
    import { configToastVisible, configToastMessage, configToastError } from '../stores.js';
</script>

<div id="config-toast" class="config-toast" class:show={$configToastVisible} class:error={$configToastError}>
    {$configToastMessage}
</div>
