import SnowflakeId from 'snowflake-id';

const snowflake = new SnowflakeId({
    mid: 1, // 机器 ID
    offset: 1672531200000, // 自定义起始时间戳 (2023-01-01)
});

export default snowflake;
